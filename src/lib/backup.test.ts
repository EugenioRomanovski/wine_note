import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { unzipSync, strFromU8 } from 'fflate'
import { db } from '../storage/db'
import { BackupError, buildBackup, importBackup } from './backup'

const img = (bytes: number[], type = 'image/jpeg') => new Blob([new Uint8Array(bytes)], { type })
const blobBytes = async (b: Blob) => [...new Uint8Array(await b.arrayBuffer())]

async function seed() {
  const p1 = (await db.photos.add({ blob: img([1, 2, 3]), createdAt: '2026-10-01T10:00:00Z' })) as number
  const p2 = (await db.photos.add({ blob: img([4, 5], 'image/png'), createdAt: '2026-10-02T10:00:00Z' })) as number
  const avatar = (await db.photos.add({ blob: img([9]), createdAt: '2026-10-03T10:00:00Z' })) as number
  await db.notes.add({
    name: 'Шабли / Premier Cru',
    impression: 'good',
    grapes: ['Шардоне'],
    regions: ['Шабли'],
    tags: [],
    photoIds: [p1, p2],
    tastedAt: '2026-10-10T18:00:00',
    createdAt: '2026-10-10T18:00:00Z',
    updatedAt: '2026-10-10T18:00:00Z',
  })
  await db.profile.add({ name: 'Евгений', theme: 'dark', feedView: 'short', avatarPhotoId: avatar })
}

beforeEach(async () => {
  await Promise.all([db.notes.clear(), db.photos.clear(), db.profile.clear()])
})

describe('backup', () => {
  it('builds a zip with data.json first and photos in readable folders', async () => {
    await seed()
    const files = unzipSync(new Uint8Array(await (await buildBackup()).arrayBuffer()))
    const names = Object.keys(files)
    expect(names[0]).toBe('data.json')
    expect(names).toContain('Фото/2026-10-10 Шабли Premier Cru/01.jpg')
    expect(names).toContain('Фото/2026-10-10 Шабли Premier Cru/02.png')
    expect(names).toContain('Профиль/аватар.jpg')
    const manifest = JSON.parse(strFromU8(files['data.json']))
    expect(manifest).toMatchObject({ app: 'winenote', format: 2 })
    expect(manifest.notes).toHaveLength(1)
  })

  it('restores notes, photos and profile from the zip, replacing current data', async () => {
    await seed()
    const zip = await buildBackup()
    // данные изменились после бэкапа
    await db.notes.add({ ...(await db.notes.toCollection().first())!, id: undefined, name: 'лишняя' })
    await db.photos.add({ blob: img([7, 7, 7]), createdAt: '2026-10-05T10:00:00Z' })

    const r = await importBackup(zip)
    expect(r).toEqual({ notes: 1, photos: 3 })
    const [note] = await db.notes.toArray()
    expect(await db.notes.count()).toBe(1)
    expect(note.name).toBe('Шабли / Premier Cru')
    expect(await db.photos.count()).toBe(3)
    const photos = await db.photos.bulkGet(note.photoIds)
    expect(await blobBytes(photos[0]!.blob)).toEqual([1, 2, 3])
    expect(photos[1]!.blob.type).toBe('image/png')
    const [profile] = await db.profile.toArray()
    expect(profile).toMatchObject({ name: 'Евгений', theme: 'dark', feedView: 'short' })
    expect(await blobBytes((await db.photos.get(profile.avatarPhotoId!))!.blob)).toEqual([9])
  })

  it('still restores old JSON backups (format 1)', async () => {
    const legacy = {
      version: 1,
      notes: [{ id: 5, name: 'Старое', impression: 'want_more', grapes: [], regions: [], tags: [], photoIds: [3], tastedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }],
      photos: [{ id: 3, createdAt: '2025-01-01T00:00:00Z', type: 'image/jpeg', dataBase64: btoa(String.fromCharCode(1, 2)) }],
      profile: [{ id: 1, name: 'Я', theme: 'light' }],
    }
    const r = await importBackup(new Blob([JSON.stringify(legacy)], { type: 'application/json' }))
    expect(r).toEqual({ notes: 1, photos: 1 })
    expect(await blobBytes((await db.photos.get(3))!.blob)).toEqual([1, 2])
  })

  it('rejects foreign files and keeps current data', async () => {
    await seed()
    await expect(importBackup(new Blob(['{"hello": 1}']))).rejects.toThrow(BackupError)
    const { zipSync, strToU8 } = await import('fflate')
    const foreign = new Blob([zipSync({ 'readme.txt': strToU8('hi') }) as BlobPart])
    await expect(importBackup(foreign)).rejects.toThrow('Это не резервная копия Wine Note')
    expect(await db.notes.count()).toBe(1)
    expect(await db.photos.count()).toBe(3)
  })
})
