import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../storage/db'
import type { Impression } from '../types'
import { AppHeader } from '../components/AppHeader'
import { BottomNav } from '../components/BottomNav'
import { NoteCardFull, NoteCardShort } from '../components/NoteCards'
import { GridViewIcon, ListViewIcon } from '../components/icons'

type Filter = 'all' | Impression
type View = 'full' | 'short'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'want_more', label: 'Хочу ещё' },
  { value: 'good', label: 'Хорошо' },
  { value: 'not_mine', label: 'Не моё' },
]

function loadView(): View {
  return localStorage.getItem('feedView') === 'short' ? 'short' : 'full'
}

export default function FeedScreen() {
  const notes = useLiveQuery(() => db.notes.orderBy('tastedAt').reverse().toArray(), [])
  const [filter, setFilter] = useState<Filter>('all')
  const [view, setViewState] = useState<View>(loadView)

  const setView = (v: View) => {
    setViewState(v)
    localStorage.setItem('feedView', v)
  }

  if (!notes) return null

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
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`chip ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
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
