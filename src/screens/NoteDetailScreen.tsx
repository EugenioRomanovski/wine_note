import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../storage/db'
import { formatDayTime } from '../lib/dates'
import { WINE_COLORS } from '../lib/labels'
import { ImpressionChip } from '../components/ImpressionChip'
import { PhotoImg } from '../components/PhotoImg'
import { BottomNav } from '../components/BottomNav'
import { ArrowLeftIcon, PencilIcon, PinIcon, TrashIcon } from '../components/icons'
import { RecommendSheet } from '../components/RecommendSheet'
import { useAuth } from '../hooks/useAuth'

export default function NoteDetailScreen() {
  const { id } = useParams()
  const noteId = Number(id)
  const navigate = useNavigate()
  const note = useLiveQuery(() => db.notes.get(noteId), [noteId])
  const signedIn = !!useAuth()
  const [recommendOpen, setRecommendOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  if (!note) return null

  const photoId = note.photoIds[0] ?? null
  const colorLabel = WINE_COLORS.find((c) => c.value === note.color)?.label
  const grapes = note.grapes ?? []
  const chips = [
    // купаж — все сорта одним чипом: «сорт/сорт/сорт»
    ...(grapes.length > 0 ? [grapes.join('/')] : []),
    ...(colorLabel ? [colorLabel] : []),
    ...note.tags,
    ...(note.regions ?? []),
  ]

  const remove = async () => {
    if (!window.confirm('Удалить эту запись без возможности восстановления?')) return
    await db.transaction('rw', db.notes, db.photos, async () => {
      await db.photos.bulkDelete(note.photoIds)
      await db.notes.delete(noteId)
    })
    navigate('/', { replace: true })
  }

  return (
    <div className="screen with-nav">
      {photoId != null && (
        <div className="detail-hero">
          <PhotoImg photoId={photoId} alt={note.name} />
          <button className="hero-btn back" onClick={() => navigate(-1)} aria-label="Назад">
            <ArrowLeftIcon size={20} />
          </button>
          <button
            className="hero-btn edit"
            onClick={() => navigate(`/note/${noteId}/edit`)}
            aria-label="Редактировать"
          >
            <PencilIcon size={18} />
          </button>
          <button className="hero-btn delete" onClick={() => void remove()} aria-label="Удалить">
            <TrashIcon size={18} />
          </button>
        </div>
      )}
      {photoId == null && (
        <div className="detail-plain-actions">
          <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Назад">
            <ArrowLeftIcon size={20} />
          </button>
          <div className="group">
            <button
              className="icon-btn"
              onClick={() => navigate(`/note/${noteId}/edit`)}
              aria-label="Редактировать"
            >
              <PencilIcon size={18} />
            </button>
            <button className="icon-btn" onClick={() => void remove()} aria-label="Удалить">
              <TrashIcon size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="detail-body">
        <div className="row-between">
          <ImpressionChip impression={note.impression} />
          <span className="note-date">{formatDayTime(note.tastedAt)}</span>
        </div>
        <h1 className="detail-title">{note.name}</h1>
        {note.place && (
          <div className="note-place">
            <PinIcon size={16} />
            {note.place}
          </div>
        )}
        {note.comment && (
          <div className="comment-card">
            <div className="comment-card-title">Ваш комментарий</div>
            <div className="comment-card-text">«{note.comment}»</div>
          </div>
        )}
        {chips.length > 0 && (
          <div className="detail-tags">
            {chips.map((chip) => (
              <span key={chip} className="tag-chip tag-static">
                {chip}
              </span>
            ))}
          </div>
        )}
        {signedIn && (
          <button className="btn-outline recommend-btn" onClick={() => setRecommendOpen(true)}>
            Порекомендовать другу
          </button>
        )}
      </div>

      {recommendOpen && (
        <RecommendSheet
          note={note}
          onClose={() => setRecommendOpen(false)}
          onSent={(name) => {
            setRecommendOpen(false)
            setToast(`Рекомендация отправлена: ${name}`)
            setTimeout(() => setToast(null), 2500)
          }}
        />
      )}
      {toast && <div className="toast">{toast}</div>}

      <BottomNav active="none" />
    </div>
  )
}
