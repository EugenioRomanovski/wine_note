export type Impression = 'want_more' | 'good' | 'not_mine'

export type WineColor = 'red' | 'white' | 'rose' | 'orange'

export interface WineNote {
  id?: number
  name: string
  impression: Impression
  place?: string
  comment?: string
  color?: WineColor
  grapes: string[]
  regions: string[]
  tags: string[]
  photoIds: number[]
  tastedAt: string
  createdAt: string
  updatedAt: string
}

export interface Photo {
  id?: number
  blob: Blob
  createdAt: string
}

export interface Profile {
  id?: number
  name: string
  avatarPhotoId?: number
  theme: 'light' | 'dark'
  /** Вид ленты при открытии приложения (по умолчанию — полный) */
  feedView?: FeedView
  /** Когда имя или аватар меняли в последний раз (ISO) — для синхронизации с Supabase */
  updatedAt?: string
  /** Аккаунт, с которым профиль синхронизирован в последний раз */
  syncedUserId?: string
  /** Какой локальный аватар уже загружен в облако */
  syncedAvatarPhotoId?: number
  /** Время самой свежей рекомендации от друзей, которую пользователь уже видел (ISO) */
  recsSeenAt?: string
}

export type FeedView = 'full' | 'short'
