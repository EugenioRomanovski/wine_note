import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../storage/db'
import type { WineNote } from '../types'
import { formatDay } from '../lib/dates'
import { plural, pluralWines, tastedCounts } from '../lib/stats'
import { TOTAL_GRAPES, grapeCollection } from '../lib/grapeCollection'
import { GrapeCollectionSheet } from '../components/GrapeCollectionSheet'
import { BottomNav } from '../components/BottomNav'
import { ImpressionChip } from '../components/ImpressionChip'
import { PhotoImg } from '../components/PhotoImg'
import { ChevronRightIcon, GlassIcon, HistoryIcon, PinIcon } from '../components/icons'

function tagFrequency(notes: WineNote[]): [string, number][] {
  const counts = new Map<string, number>()
  for (const note of notes) {
    for (const tag of note.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

function topValue(notes: WineNote[], pick: (n: WineNote) => string[] | undefined): string | null {
  const counts = new Map<string, number>()
  for (const note of notes) {
    for (const v of pick(note) ?? []) counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
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
  const [collectionOpen, setCollectionOpen] = useState(false)
  if (!notes) return null

  const wantMore = notes.filter((n) => n.impression === 'want_more')
  const freq = tagFrequency(notes)
  // «Мой сорт» и «Мой регион» — только по понравившимся винам
  const liked = notes.filter((n) => n.impression === 'good' || n.impression === 'want_more')
  const topGrape = topValue(liked, (n) => n.grapes)
  const topRegion = topValue(liked, (n) => n.regions)
  const memory = memoryNote(notes)
  const counts = tastedCounts(notes)
  const collection = grapeCollection(notes)

  return (
    <div className="screen with-nav">
      <h1 className="page-title">вкус со временем</h1>
      <div className="page-sub">АНАЛИТИКА ВОСПОМИНАНИЙ</div>

      {notes.length > 0 && (
        <section className="taste-section">
          <div className="taste-section-title">Мои дегустации</div>
          <div className="stat-row tasted-row">
            <div className="stat-card">
              <div className="stat-label">В этом месяце</div>
              <div className="stat-value">
                {counts.month} {pluralWines(counts.month)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">В этом году</div>
              <div className="stat-value">
                {counts.year} {pluralWines(counts.year)}
              </div>
            </div>
          </div>
          <button className="stat-card collection-card" onClick={() => setCollectionOpen(true)}>
            <div>
              <div className="stat-label">Моя коллекция сортов</div>
              <div className="stat-value">
                {collection.length} <span className="collection-total">из {TOTAL_GRAPES}</span>
              </div>
              <div className="collection-sub">
                {plural(collection.length, ['сорт открыт', 'сорта открыто', 'сортов открыто'])}
              </div>
            </div>
            <ChevronRightIcon size={20} />
          </button>
        </section>
      )}

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

      {(topGrape || topRegion) && (
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-label">Мой сорт</div>
            <div className="stat-value">{topGrape ?? '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Мой регион</div>
            <div className="stat-value">{topRegion ?? '—'}</div>
          </div>
        </div>
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

      {collectionOpen && <GrapeCollectionSheet grapes={collection} onClose={() => setCollectionOpen(false)} />}

      <BottomNav active="taste" />
    </div>
  )
}
