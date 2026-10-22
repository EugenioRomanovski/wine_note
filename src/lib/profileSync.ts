import { db } from '../storage/db'
import type { Profile } from '../types'
import { supabase } from './supabase'
import { resizeImage } from './image'

export interface RemoteProfile {
  display_name: string
  avatar_path: string | null
  updated_at: string
}

export type SyncAction = 'push' | 'pull' | 'none'

const hasData = (name: string | undefined, avatar: unknown) => Boolean(name?.trim()) || avatar != null

/**
 * Что делать с профилем: побеждает последнее изменение. Если время локального
 * изменения неизвестно (профиль заполнили до появления синхронизации или это
 * данные другого аккаунта), предпочитаем облако, когда в нём что-то есть.
 */
export function decideSync(local: Profile, remote: RemoteProfile | null, userId: string): SyncAction {
  const localHas = hasData(local.name, local.avatarPhotoId)
  if (!remote) return localHas ? 'push' : 'none'
  const remoteHas = hasData(remote.display_name, remote.avatar_path)
  const localTimeKnown = local.updatedAt && (!local.syncedUserId || local.syncedUserId === userId)
  if (!localTimeKnown) {
    if (remoteHas) return 'pull'
    return localHas ? 'push' : 'none'
  }
  const l = Date.parse(local.updatedAt!)
  const r = Date.parse(remote.updated_at)
  if (r > l) return 'pull'
  if (l > r) return 'push'
  return 'none'
}

let running: Promise<void> | null = null
let again = false

/**
 * Сверяет имя и аватар с Supabase. Безопасно вызывать сколько угодно раз:
 * параллельные вызовы склеиваются, ошибки сети не мешают работе приложения.
 */
export function syncProfile(): Promise<void> {
  if (running) {
    again = true
    return running
  }
  running = (async () => {
    do {
      again = false
      try {
        await syncOnce()
      } catch (e) {
        console.warn('Синхронизация профиля не удалась', e)
      }
    } while (again)
  })().finally(() => {
    running = null
  })
  return running
}

async function syncOnce() {
  if (!supabase) return
  const { data: auth } = await supabase.auth.getSession()
  const userId = auth.session?.user.id
  if (!userId) return
  const local = await db.profile.toCollection().first()
  if (!local) return

  const { data: remote, error } = await supabase
    .from('profiles')
    .select('display_name, avatar_path, updated_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error

  const action = decideSync(local, remote, userId)
  if (action === 'push') await push(userId, local, remote)
  else if (action === 'pull') await pull(userId, local, remote!)
  else if (local.syncedUserId !== userId) await db.profile.update(local.id!, { syncedUserId: userId })
}

async function push(userId: string, local: Profile, remote: RemoteProfile | null) {
  let avatarPath = remote?.avatar_path ?? null
  if (local.avatarPhotoId != null && (local.avatarPhotoId !== local.syncedAvatarPhotoId || !avatarPath)) {
    const photo = await db.photos.get(local.avatarPhotoId)
    if (photo) {
      const path = `${userId}/avatar.jpg`
      const { error } = await supabase!.storage
        .from('avatars')
        .upload(path, await resizeImage(photo.blob, 512), { upsert: true, contentType: 'image/jpeg' })
      if (error) throw error
      avatarPath = path
    }
  }
  const updatedAt = local.updatedAt ?? new Date().toISOString()
  const { error } = await supabase!
    .from('profiles')
    .upsert({ id: userId, display_name: local.name.trim(), avatar_path: avatarPath, updated_at: updatedAt })
  if (error) throw error
  await db.profile.update(local.id!, {
    updatedAt,
    syncedUserId: userId,
    syncedAvatarPhotoId: local.avatarPhotoId,
  })
}

async function pull(userId: string, local: Profile, remote: RemoteProfile) {
  const changes: Partial<Profile> = {
    name: remote.display_name,
    updatedAt: remote.updated_at,
    syncedUserId: userId,
  }
  if (remote.avatar_path) {
    const { data: blob, error } = await supabase!.storage.from('avatars').download(remote.avatar_path)
    if (error) throw error
    const photoId = (await db.photos.add({ blob, createdAt: new Date().toISOString() })) as number
    changes.avatarPhotoId = photoId
    changes.syncedAvatarPhotoId = photoId
    // старый аватар больше не нужен (заметки аватар не используют)
    if (local.avatarPhotoId != null) await db.photos.delete(local.avatarPhotoId)
  }
  await db.profile.update(local.id!, changes)
}
