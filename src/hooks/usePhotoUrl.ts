import { useEffect, useState } from 'react'
import { db } from '../storage/db'

/** Object URL for a photo blob; revoked when the component unmounts or the id changes. */
export function usePhotoUrl(photoId: number | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (photoId == null) {
      setUrl(null)
      return
    }
    let objectUrl: string | null = null
    let cancelled = false
    db.photos.get(photoId).then((photo) => {
      if (cancelled || !photo) return
      objectUrl = URL.createObjectURL(photo.blob)
      setUrl(objectUrl)
    })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [photoId])

  return url
}
