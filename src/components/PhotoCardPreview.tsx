import type { Impression } from '../types'
import { formatDay } from '../lib/dates'
import { ImpressionChip } from './ImpressionChip'
import { PinIcon } from './icons'

interface Props {
  name: string
  impression: Impression | null
  place: string
  /** ISO-дата дегустации */
  tastedAt: string
}

/** Правая часть карточки в пункте 3: заполняется по мере ввода, пустые поля — заглушки. */
export function PhotoCardPreview({ name, impression, place, tastedAt }: Props) {
  const title = name.trim()
  const where = place.trim()
  const isEmpty = !title && !where && !impression
  return (
    <div className="photo-card-info" aria-hidden="true">
      {impression ? <ImpressionChip impression={impression} /> : <span className="skeleton skeleton-badge" />}
      {title ? (
        <div className="photo-card-title">{title}</div>
      ) : (
        <span className="skeleton-group">
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-line" />
        </span>
      )}
      <span className="skeleton-group">
        {where ? (
          <span className="note-place photo-card-place">
            <PinIcon size={14} />
            <span>{where}</span>
          </span>
        ) : (
          <span className="skeleton skeleton-line-sm" style={{ width: '75%' }} />
        )}
        {isEmpty ? (
          <span className="skeleton skeleton-line-sm" style={{ width: '68%' }} />
        ) : (
          <span className="note-date">{formatDay(tastedAt)}</span>
        )}
      </span>
    </div>
  )
}
