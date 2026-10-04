import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../storage/db'
import type { WineNote } from '../types'
import { formatDay } from '../lib/dates'
import { BottomNav } from '../components/BottomNav'
import { ImpressionChip } from '../components/ImpressionChip'
import { PhotoImg } from '../components/PhotoImg'
import { GlassIcon, HistoryIcon, PinIcon } from '../components/icons'

function tagFrequency(notes: WineNote[]): [string, number][] {
  const counts = new Map<string, number>()
  for (const note of notes) {
    for (const tag of note.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

/** Note closest to "one year ago", considering notes at least 300 days old. */
function memoryNote(notes: WineNote[]): WineNote | null {
  const now = Date.now()
  const yearMs = 365 * 24 * 60 * 60 * 1000
  const minAge = now - 300 * 24 * 60 * 60 * 1000
  const candidates = notes.filter((n) => new Date(n.tastedAt).getTime() < minAge)
  if (candidates.length === 0) return null
  const target = now - yearMs
  return candidates.reduce((best, n) =>
    Math.abs(new Date(n.tastedAt).getTime() - target) < Math.abs(new Date(best.tastedAt).getTime() - target)
      ? n
      : best,
  )
}

export default function TasteScreen() {
  const notes = useLiveQuery(() => db.notes.orderBy('tastedAt').reverse().toArray(), [])
  if (!notes) return null

  const wantMore = notes.filter((n) => n.impression === 'want_more')
  const freq = tagFrequency(notes)
  const memory = memoryNote(notes)

  return (
    <div className="screen with-nav">
      <h1 className="page-title">вкус со временем</h1>
      <div className="page-sub">АНАЛИТИКА ВОСПОМИНАНИЙ</div>

      {wantMore.length > 0 && (
        <section className="taste-section">
          <div className="taste-section-title">Хочу повторить</div>
          <div className="h-scroll">
            {wantMore.map((note) => {
              const photoId = note.photoIds[0] ?? null
              return (
                <Link key={note.id} to={`/note/${note.id}`} className="repeat-card">
                  {photoId != null ? (
                    <PhotoImg photoId={photoId} alt={note.name} />
                  ) : (
                    <span className="no-photo">
                      <GlassIcon size={22} />
                    </span>
                  )}
                  <div>
                    <div className="repeat-card-name">{note.name}</div>
                    <div className="repeat-card-date">{formatDay(note.tastedAt)}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {freq.length > 0 && (
        <section className="taste-section">
          <div className="taste-section-title">Мои частые слова</div>
          <div className="taste-section-sub">Какими оттенками вкуса вы описываете свои бокалы</div>
          <div className="tag-cloud" style={{ marginTop: 0 }}>
            {freq.map(([tag], i) => (
              <span key={tag} className={`tag-chip ${i < 3 ? 'tag-static' : 'tag-neutral'}`}>
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {memory && (
        <section className="taste-section">
          <div className="taste-section-title">Из памяти</div>
          <div className="memory-label">
            <HistoryIcon size={16} />
            Год назад вы пили это вино
          </div>
          <Link to={`/note/${memory.id}`} className="memory-card">
            {(memory.photoIds[0] ?? null) != null && (
              <PhotoImg photoId={memory.photoIds[0]} alt={memory.name} />
            )}
            <div>
              <div className="memory-card-name">{memory.name}</div>
              {memory.place && (
                <div className="note-place">
                  <PinIcon size={14} />
                  {memory.place}
                </div>
              )}
              <ImpressionChip impression={memory.impression} />
            </div>
          </Link>
        </section>
      )}

      <BottomNav active="taste" />
    </div>
  )
}
