import { Unzip, UnzipInflate, Zip, ZipDeflate, ZipPassThrough, strFromU8, strToU8, type UnzipFile } from 'fflate'
import { db } from '../storage/db'
import type { Photo, Profile, WineNote } from '../types'

/*
 * Формат бэкапа 2 — ZIP-архив:
 *   data.json        — манифест: заметки, профиль и описание фото (всегда первый файл)
 *   Фото/…, Профиль/… — сами фото обычными файлами, их можно достать и без приложения
 * Формат 1 (один JSON-файл с фото в base64) по-прежнему восстанавливается.
 */

const MANIFEST = 'data.json'

/** Ошибка, текст которой можно показать пользователю. */
export class BackupError extends Error {}
const NOT_OURS = 'Это не резервная копия Wine Note'

interface PhotoEntry {
  id: number
  createdAt: string
  type: string
  size: number
  path: string
}

interface Manifest {
  app: 'winenote'
  format: 2
  exportedAt: string
  notes: WineNote[]
  profile: Profile[]
  photos: PhotoEntry[]
}

export interface RestoreResult {
  notes: number
  photos: number
}

export function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/gif': 'gif',
}
const extOf = (type: string) => EXT[type.split(';')[0]] || 'bin'
const clean = (s: string) =>
  s.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'без названия'
const pad = (n: number) => String(n).padStart(2, '0')
const localDate = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? 'без даты' : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Понятные пути внутри архива: «Фото/2026-10-10 Шабли/01.jpg». */
function planPaths(photos: Photo[], notes: WineNote[], profile: Profile[]) {
  const byId = new Map(photos.map((p) => [p.id!, p]))
  const paths = new Map<number, string>()
  const used = new Set<string>()
  const take = (id: number, base: string) => {
    const p = byId.get(id)
    if (!p || paths.has(id)) return
    const ext = extOf(p.blob.type)
    let path = `${base}.${ext}`
    for (let i = 2; used.has(path.toLowerCase()); i++) path = `${base} (${i}).${ext}`
    used.add(path.toLowerCase())
    paths.set(id, path)
  }
  for (const n of notes) {
    const dir = `Фото/${localDate(n.tastedAt)} ${clean(n.name)}`
    n.photoIds.forEach((id, i) => take(id, `${dir}/${pad(i + 1)}`))
  }
  for (const p of profile) if (p.avatarPhotoId != null) take(p.avatarPhotoId, 'Профиль/аватар')
  for (const p of photos) take(p.id!, `Прочее/${p.id}`)
  return paths
}

export async function buildBackup(): Promise<Blob> {
  const [notes, profile, ids] = await Promise.all([
    db.notes.toArray(),
    db.profile.toArray(),
    db.photos.toCollection().primaryKeys(),
  ])
  const photos = (await db.photos.bulkGet(ids)).filter(Boolean) as Photo[]
  const paths = planPaths(photos, notes, profile)
  const entries: PhotoEntry[] = photos.map((p) => ({
    id: p.id!,
    createdAt: p.createdAt,
    type: p.blob.type,
    size: p.blob.size,
    path: paths.get(p.id!)!,
  }))
  const manifest: Manifest = {
    app: 'winenote',
    format: 2,
    exportedAt: new Date().toISOString(),
    notes,
    profile,
    photos: entries,
  }

  const chunks: Uint8Array[] = []
  let fail: (e: Error) => void = () => {}
  let finish: () => void = () => {}
  const done = new Promise<void>((res, rej) => ((finish = res), (fail = rej)))
  const zip = new Zip((err, data, final) => {
    if (err) return fail(err)
    chunks.push(data)
    if (final) finish()
  })
  const json = new ZipDeflate(MANIFEST, { level: 6 })
  zip.add(json)
  json.push(strToU8(JSON.stringify(manifest)), true)
  // фото уже сжаты — кладём как есть
  const byId = new Map(photos.map((p) => [p.id!, p]))
  for (const e of entries) {
    const f = new ZipPassThrough(e.path)
    zip.add(f)
    f.push(new Uint8Array(await byId.get(e.id)!.blob.arrayBuffer()), true)
  }
  zip.end()
  await done
  return new Blob(chunks as BlobPart[], { type: 'application/zip' })
}

export async function exportBackup() {
  download(`winenote-backup-${localDate(new Date().toISOString())}.zip`, await buildBackup())
}

/**
 * Заменяет все данные на восстановленные. Фото к этому моменту уже записаны новыми записями
 * (photoIdMap: id из бэкапа → новый id), старые фото удаляются в той же транзакции.
 */
async function replaceAll(notes: WineNote[], profile: Profile[], keepPhotoIds: number[], photoIdMap: Map<number, number>) {
  const remap = (id: number) => photoIdMap.get(id)
  await db.transaction('rw', db.notes, db.photos, db.profile, async () => {
    const keep = new Set(keepPhotoIds)
    const old = (await db.photos.toCollection().primaryKeys()).filter((id) => !keep.has(id as number))
    await db.photos.bulkDelete(old)
    await db.notes.clear()
    await db.profile.clear()
    await db.notes.bulkAdd(
      notes.map((n) => ({ ...n, photoIds: (n.photoIds ?? []).map(remap).filter((id): id is number => id != null) })),
    )
    if (profile.length > 0) {
      await db.profile.bulkAdd(
        profile.map((p) => ({ ...p, avatarPhotoId: p.avatarPhotoId != null ? remap(p.avatarPhotoId) : undefined })),
      )
    }
  })
}

async function restoreZip(file: Blob): Promise<RestoreResult> {
  const written: number[] = []
  const photoIdMap = new Map<number, number>()
  let manifest: Manifest | null = null
  let byPath = new Map<string, PhotoEntry>()
  const got = new Set<string>()
  const queue: { name: string; data: Uint8Array }[] = []
  let streamError: Error | null = null

  const unzip = new Unzip((f: UnzipFile) => {
    const parts: Uint8Array[] = []
    f.ondata = (err, data, final) => {
      if (err) return void (streamError = err)
      parts.push(data)
      if (final) {
        const all = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
        let o = 0
        for (const p of parts) (all.set(p, o), (o += p.length))
        queue.push({ name: f.name, data: all })
      }
    }
    f.start()
  })
  unzip.register(UnzipInflate)

  const process = async () => {
    while (queue.length) {
      const { name, data } = queue.shift()!
      if (!manifest) {
        if (name !== MANIFEST) throw new BackupError(NOT_OURS)
        const m = JSON.parse(strFromU8(data))
        if (m?.app !== 'winenote' || m.format !== 2 || !Array.isArray(m.notes)) throw new BackupError(NOT_OURS)
        manifest = m as Manifest
        byPath = new Map(manifest.photos.map((e) => [e.path, e]))
        continue
      }
      const entry = byPath.get(name)
      if (!entry || got.has(name)) continue // посторонний файл — пропускаем
      if (data.length !== entry.size) throw new BackupError(`Архив повреждён: ${name}`)
      const blob = new Blob([data as BlobPart], { type: entry.type })
      // новой записью: текущие фото не трогаем, пока восстановление не завершится успешно
      const newId = (await db.photos.add({ blob, createdAt: entry.createdAt })) as number
      written.push(newId)
      photoIdMap.set(entry.id, newId)
      got.add(name)
    }
  }

  try {
    const reader = file.stream().getReader()
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      unzip.push(value)
      if (streamError) throw streamError
      await process()
    }
    unzip.push(new Uint8Array(0), true)
    if (streamError) throw streamError
    await process()
    if (!manifest) throw new BackupError(NOT_OURS)
    const m = manifest as Manifest
    const missing = [...byPath.keys()].filter((p) => !got.has(p))
    if (missing.length) throw new BackupError(`Архив повреждён: не хватает файлов (${missing.length})`)
    await replaceAll(m.notes, m.profile ?? [], written, photoIdMap)
    return { notes: m.notes.length, photos: written.length }
  } catch (e) {
    // не оставляем наполовину восстановленные фото
    if (written.length) await db.photos.bulkDelete(written)
    throw e instanceof BackupError ? e : new BackupError('Не удалось прочитать архив')
  }
}

interface LegacyPhoto {
  id: number
  createdAt: string
  type: string
  dataBase64: string
}

function base64ToBlob(data: string, type: string): Blob {
  const bin = atob(data)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type })
}

/** Формат 1: JSON-файл с фото в base64 (бэкапы, сделанные до перехода на ZIP). */
async function restoreJson(file: Blob): Promise<RestoreResult> {
  let data
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new BackupError(NOT_OURS)
  }
  if (!Array.isArray(data?.notes)) throw new BackupError(NOT_OURS)
  const photos: LegacyPhoto[] = Array.isArray(data.photos) ? data.photos : []
  await db.transaction('rw', db.notes, db.photos, db.profile, async () => {
    await Promise.all([db.notes.clear(), db.photos.clear(), db.profile.clear()])
    await db.photos.bulkAdd(
      photos.map((p) => ({ id: p.id, createdAt: p.createdAt, blob: base64ToBlob(p.dataBase64, p.type || 'image/jpeg') })),
    )
    await db.notes.bulkAdd(data.notes)
    if (Array.isArray(data.profile) && data.profile.length > 0) await db.profile.bulkAdd(data.profile)
  })
  return { notes: data.notes.length, photos: photos.length }
}

/** Восстанавливает данные из бэкапа (ZIP или старый JSON), заменяя текущие. */
export async function importBackup(file: Blob): Promise<RestoreResult> {
  const head = new Uint8Array(await file.slice(0, 2).arrayBuffer())
  return head[0] === 0x50 && head[1] === 0x4b ? restoreZip(file) : restoreJson(file)
}
