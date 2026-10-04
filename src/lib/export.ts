import { db } from '../storage/db'

export function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

export async function exportCsv() {
  const notes = await db.notes.orderBy('tastedAt').reverse().toArray()
  const header = ['Название', 'Впечатление', 'Место', 'Комментарий', 'Цвет', 'Сорт', 'Регион', 'Оттенки вкуса', 'Дата']
  const lines = notes.map((n) =>
    [
      csvEscape(n.name),
      csvEscape(n.impression),
      csvEscape(n.place ?? ''),
      csvEscape(n.comment ?? ''),
      csvEscape(n.color ?? ''),
      csvEscape((n.grapes ?? []).join(', ')),
      csvEscape((n.regions ?? []).join(', ')),
      csvEscape(n.tags.join(', ')),
      csvEscape(n.tastedAt),
    ].join(';'),
  )
  const csv = '﻿' + [header.join(';'), ...lines].join('\r\n')
  download('winenote-export.csv', new Blob([csv], { type: 'text/csv;charset=utf-8' }))
}

interface BackupPhoto {
  id: number
  createdAt: string
  type: string
  dataBase64: string
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(data: string, type: string): Blob {
  const bin = atob(data)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type })
}

export async function exportBackup() {
  const [notes, photos, profile] = await Promise.all([
    db.notes.toArray(),
    db.photos.toArray(),
    db.profile.toArray(),
  ])
  const backupPhotos: BackupPhoto[] = await Promise.all(
    photos.map(async (p) => ({
      id: p.id!,
      createdAt: p.createdAt,
      type: p.blob.type,
      dataBase64: await blobToBase64(p.blob),
    })),
  )
  const payload = JSON.stringify(
    { version: 1, exportedAt: new Date().toISOString(), notes, photos: backupPhotos, profile },
    null,
    2,
  )
  download('winenote-backup.json', new Blob([payload], { type: 'application/json' }))
}

export async function importBackup(file: File): Promise<void> {
  const text = await file.text()
  const data = JSON.parse(text)
  if (!Array.isArray(data.notes)) throw new Error('Неверный формат файла бэкапа')
  await db.transaction('rw', db.notes, db.photos, db.profile, async () => {
    await Promise.all([db.notes.clear(), db.photos.clear(), db.profile.clear()])
    if (Array.isArray(data.photos)) {
      await db.photos.bulkAdd(
        (data.photos as BackupPhoto[]).map((p) => ({
          id: p.id,
          createdAt: p.createdAt,
          blob: base64ToBlob(p.dataBase64, p.type || 'image/jpeg'),
        })),
      )
    }
    await db.notes.bulkAdd(data.notes)
    if (Array.isArray(data.profile) && data.profile.length > 0) {
      await db.profile.bulkAdd(data.profile)
    }
  })
}
