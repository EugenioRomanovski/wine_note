import { useEffect, useState } from 'react'
import { recPhotoUrl } from '../lib/social'

/** Ссылка на фото рекомендации (null — фото нет или ещё грузится). */
export function useRecPhotoUrl(path: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    setUrl(null)
    if (!path) return
    let active = true
    void recPhotoUrl(path).then((u) => active && setUrl(u))
    return () => {
      active = false
    }
  }, [path])
  return url
}
