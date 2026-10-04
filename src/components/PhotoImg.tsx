import { usePhotoUrl } from '../hooks/usePhotoUrl'

export function PhotoImg({
  photoId,
  className,
  alt = '',
}: {
  photoId: number | null | undefined
  className?: string
  alt?: string
}) {
  const url = usePhotoUrl(photoId)
  if (!url) return null
  return <img src={url} className={className} alt={alt} />
}
