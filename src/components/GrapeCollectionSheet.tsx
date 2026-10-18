import { useEffect } from 'react'
import type { CollectedGrape } from '../lib/grapeCollection'
import { TOTAL_GRAPES } from '../lib/grapeCollection'
import { plural } from '../lib/stats'
import { XIcon } from './icons'

interface Props {
  grapes: CollectedGrape[]
  onClose: () => void
}

/** Нижняя шторка со списком открытых сортов. */
export function GrapeCollectionSheet({ grapes, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet sheet-list" role="dialog" aria-modal="true" aria-labelledby="collection-title">
        <div className="sheet-handle" />
        <button className="sheet-close" onClick={onClose} aria-label="Закрыть">
          <XIcon size={18} />
        </button>
        <div className="sheet-title" id="collection-title">
          Моя коллекция сортов
        </div>
        <p className="sheet-sub">
          Открыто {grapes.length} из {TOTAL_GRAPES}
        </p>
        {grapes.length === 0 ? (
          <p className="collection-empty">
            Указывайте сорт винограда в заметках — открытые сорта будут собираться здесь.
          </p>
        ) : (
          <ul className="collection-list">
            {grapes.map((g) => (
              <li key={g.ru} className="collection-item">
                <div className="collection-item-main">
                  <div className="collection-item-name">{g.ru}</div>
                  <div className="collection-item-orig">
                    {g.orig}
                    {g.aliases.length > 0 && <> · в заметках: {g.aliases.join(', ')}</>}
                  </div>
                </div>
                <div className="collection-item-count">
                  {g.tastings} {plural(g.tastings, ['раз', 'раза', 'раз'])}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
