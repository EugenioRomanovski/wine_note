import type { Impression } from '../types'
import { IMPRESSION_LABELS } from '../lib/labels'
import { BrokenHeartIcon, GlassIcon, HeartIcon } from './icons'

export function ImpressionIcon({ impression, size = 15 }: { impression: Impression; size?: number }) {
  if (impression === 'want_more') return <HeartIcon size={size} />
  if (impression === 'good') return <GlassIcon size={size} />
  return <BrokenHeartIcon size={size} />
}

export function ImpressionChip({ impression }: { impression: Impression }) {
  return (
    <span className={`imp-chip imp-${impression}`}>
      <ImpressionIcon impression={impression} />
      {IMPRESSION_LABELS[impression]}
    </span>
  )
}
