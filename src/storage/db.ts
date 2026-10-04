import Dexie, { type EntityTable } from 'dexie'
import type { Photo, Profile, WineNote } from '../types'

const db = new Dexie('winenote') as Dexie & {
  notes: EntityTable<WineNote, 'id'>
  photos: EntityTable<Photo, 'id'>
  profile: EntityTable<Profile, 'id'>
}

db.version(1).stores({
  notes: '++id, name, impression, tastedAt, updatedAt',
  photos: '++id',
  profile: '++id',
})

export { db }
