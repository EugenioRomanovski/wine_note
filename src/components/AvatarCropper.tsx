import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react'
import { createPortal } from 'react-dom'
import { MinusIcon, PlusIcon } from './icons'

const OUT = 400 // размер сохраняемого аватара, px
const MAX_ZOOM = 4
const MAX_SOURCE = 2000 // исходник уменьшаем до этого размера по большей стороне

interface View {
  s: number
  x: number
  y: number
}

/** Картинка → холст не больше MAX_SOURCE по большей стороне (с учётом поворота из EXIF). */
async function loadCanvas(file: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file)
  const k = Math.min(1, MAX_SOURCE / Math.max(bitmap.width, bitmap.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bitmap.width * k)
  c.height = Math.round(bitmap.height * k)
  c.getContext('2d')!.drawImage(bitmap, 0, 0, c.width, c.height)
  bitmap.close()
  return c
}

const toJpeg = (c: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/jpeg', quality),
  )

/** Фото в круглой рамке: перетащить — сдвинуть, щипок / колесо / ползунок — масштаб. */
export function AvatarCropper({ file, onCancel, onDone }: { file: Blob; onCancel: () => void; onDone: (square: Blob) => void }) {
  const [src, setSrc] = useState<HTMLCanvasElement | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [view, setView] = useState<View | null>(null)
  const [saving, setSaving] = useState(false)
  const frame = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const V = Math.min(window.innerWidth - 48, 320)

  const cancelRef = useRef(onCancel)
  cancelRef.current = onCancel
  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false
    loadCanvas(file)
      .then(async (c) => {
        const blob = await toJpeg(c, 0.92)
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(c)
        setUrl(objectUrl)
      })
      .catch(() => cancelRef.current())
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  const minS = useMemo(() => (src ? V / Math.min(src.width, src.height) : 1), [src, V])

  // фото всегда закрывает весь круг
  const clamp = (v: View): View => {
    if (!src) return v
    const s = Math.min(minS * MAX_ZOOM, Math.max(minS, v.s))
    const w = src.width * s
    const h = src.height * s
    return { s, x: Math.min(0, Math.max(V - w, v.x)), y: Math.min(0, Math.max(V - h, v.y)) }
  }

  useEffect(() => {
    if (src) setView(clamp({ s: minS, x: (V - src.width * minS) / 2, y: (V - src.height * minS) / 2 }))
  }, [src, minS])

  /** Масштаб ns, точка рамки (fx, fy) остаётся на месте. */
  const zoomAt = (v: View, ns: number, fx: number, fy: number) =>
    clamp({ s: ns, x: fx - ((fx - v.x) * ns) / v.s, y: fy - ((fy - v.y) * ns) / v.s })

  const local = (e: { clientX: number; clientY: number }) => {
    const r = frame.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const onPointerDown = (e: PointerEvent) => {
    frame.current?.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, local(e))
  }
  const onPointerMove = (e: PointerEvent) => {
    const ps = pointers.current
    const prev = ps.get(e.pointerId)
    if (!prev || !view) return
    const now = local(e)
    if (ps.size === 1) {
      setView(clamp({ ...view, x: view.x + now.x - prev.x, y: view.y + now.y - prev.y }))
    } else if (ps.size === 2) {
      const other = [...ps.entries()].find(([id]) => id !== e.pointerId)![1]
      const d0 = Math.hypot(prev.x - other.x, prev.y - other.y)
      const d1 = Math.hypot(now.x - other.x, now.y - other.y)
      if (d0 > 0) setView(zoomAt(view, (view.s * d1) / d0, (now.x + other.x) / 2, (now.y + other.y) / 2))
    }
    ps.set(e.pointerId, now)
  }
  const onPointerUp = (e: PointerEvent) => pointers.current.delete(e.pointerId)

  const onWheel = (e: WheelEvent) => {
    if (!view) return
    const p = local(e)
    setView(zoomAt(view, view.s * Math.exp(-e.deltaY / 400), p.x, p.y))
  }

  const zoom = view ? view.s / minS : 1
  const setZoom = (z: number) => view && setView(zoomAt(view, minS * z, V / 2, V / 2))

  const save = async () => {
    if (!src || !view) return
    setSaving(true)
    const c = document.createElement('canvas')
    c.width = c.height = OUT
    const size = V / view.s
    c.getContext('2d')!.drawImage(src, -view.x / view.s, -view.y / view.s, size, size, 0, 0, OUT, OUT)
    try {
      onDone(await toJpeg(c, 0.88))
    } catch {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="cropper" role="dialog" aria-label="Фото профиля">
      <div className="cropper-bar">
        <button className="cropper-link" onClick={onCancel}>
          Отмена
        </button>
        <div className="cropper-title">Фото профиля</div>
        <button className="cropper-link cropper-done" onClick={() => void save()} disabled={!view || saving}>
          Готово
        </button>
      </div>

      <div className="cropper-stage">
        <div
          ref={frame}
          className="cropper-frame"
          style={{ width: V, height: V }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        >
          {url && view && src && (
            <img
              src={url}
              alt=""
              draggable={false}
              className="cropper-img"
              style={{
                width: src.width,
                height: src.height,
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`,
              }}
            />
          )}
          {/* круглая рамка: всё за её пределами затемнено */}
          <div className="cropper-circle" />
        </div>
        <div className="cropper-hint">Перетащите фото и увеличьте пальцами</div>
      </div>

      <div className="cropper-controls">
        <div className="cropper-zoom">
          <button aria-label="Уменьшить" onClick={() => setZoom(Math.max(1, zoom - 0.25))}>
            <MinusIcon size={20} />
          </button>
          <input
            type="range"
            aria-label="Масштаб"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
          <button aria-label="Увеличить" onClick={() => setZoom(Math.min(MAX_ZOOM, zoom + 0.25))}>
            <PlusIcon size={20} />
          </button>
        </div>
        <button className="btn-accent" onClick={() => void save()} disabled={!view || saving}>
          {saving ? 'Сохраняем…' : 'Сохранить фото'}
        </button>
      </div>
    </div>,
    document.body,
  )
}
