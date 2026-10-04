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
}
