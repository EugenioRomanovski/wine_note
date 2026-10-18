import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../storage/db'
import type { FeedView, Impression } from '../types'
import { AppHeader } from '../components/AppHeader'
import { BottomNav } from '../components/BottomNav'
import { NoteCardFull, NoteCardShort } from '../components/NoteCards'
import { GridViewIcon, ListViewIcon } from '../components/icons'
import { ImpressionIcon } from '../components/ImpressionChip'
import { IMPRESSION_LABELS } from '../lib/labels'

type Filter = 'all' | Impression

/**
 * Вид, выбранный переключателем в ленте, — живёт до перезапуска приложения.
 * При запуске лента открывается в виде из настроек профиля.
 */
let sessionView: FeedView | null = null

export default function FeedScreen() {
  const notes = useLiveQuery(() => db.notes.orderBy('tastedAt').reverse().toArray(), [])
  const profile = useLiveQuery(() => db.profile.toCollection().first(), [])
  const [filter, setFilter] = useState<Filter>('all')
  const [override, setOverride] = useState<FeedView | null>(sessionView)

  const setView = (v: FeedView) => {
    sessionView = v
    setOverride(v)
  }

  // ждём и профиль, чтобы лента не мигала полным видом перед сокращённым
  if (!notes || !profile) return null
  const view: FeedView = override ?? profile?.feedView ?? 'full'

  if (notes.length === 0) {
    return (
      <div className="screen with-nav">
        <AppHeader />
        <div className="empty-wrap">
          <div className="empty-card">
            <div className="empty-title">Запишите первое впечатление</div>
            <p className="empty-text">
              Сохраняйте вина, которые вам понравились, и собирайте свою коллекцию впечатлений.
            </p>
            <Link to="/new" className="btn-accent" style={{ textDecoration: 'none' }}>
              Добавить запись
            </Link>
          </div>
        </div>
        <BottomNav active="feed" />
      </div>
    )
  }

  const filtered = filter === 'all' ? notes : notes.filter((n) => n.impression === filter)

  return (
    <div className="screen with-nav">
      <AppHeader />
      <div className="filter-row">
        <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          Все
        </button>
        {(['want_more', 'good', 'not_mine'] as Impression[]).map((imp) => (
          <button
            key={imp}
            className={`chip chip-icon ${filter === imp ? 'active' : ''}`}
            onClick={() => setFilter(imp)}
            aria-label={IMPRESSION_LABELS[imp]}
            title={IMPRESSION_LABELS[imp]}
          >
            <ImpressionIcon impression={imp} size={17} />
          </button>
        ))}
        <span className="spacer" />
        <button
          className={`view-toggle ${view === 'full' ? 'active' : ''}`}
          onClick={() => setView('full')}
          aria-label="Крупные карточки"
        >
          <GridViewIcon size={19} />
        </button>
        <button
          className={`view-toggle ${view === 'short' ? 'active' : ''}`}
          onClick={() => setView('short')}
          aria-label="Компактные карточки"
        >
          <ListViewIcon size={19} />
        </button>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-filter">Пока нет записей с таким впечатлением</div>
      ) : (
        <div className="note-list">
          {filtered.map((note) =>
            view === 'full' ? (
              <NoteCardFull key={note.id} note={note} />
            ) : (
              <NoteCardShort key={note.id} note={note} />
            ),
          )}
        </div>
      )}
      <BottomNav active="feed" />
    </div>
  )
}
