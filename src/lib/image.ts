/** Уменьшает картинку до maxSize по большей стороне и пережимает в JPEG. */
export async function resizeImage(blob: Blob, maxSize: number, quality = 0.85): Promise<Blob> {
  if (typeof createImageBitmap !== 'function') return blob
  const bitmap = await createImageBitmap(blob)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? blob), 'image/jpeg', quality))
}
