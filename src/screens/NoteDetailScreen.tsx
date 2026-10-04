import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../storage/db'
import { formatDayTime } from '../lib/dates'
import { ImpressionChip } from '../components/ImpressionChip'
import { PhotoImg } from '../components/PhotoImg'
import { BottomNav } from '../components/BottomNav'
import { ArrowLeftIcon, PencilIcon, PinIcon, TrashIcon } from '../components/icons'

export default function NoteDetailScreen() {
  const { id } = useParams()
  const noteId = Number(id)
  const navigate = useNavigate()
  const note = useLiveQuery(() => db.notes.get(noteId), [noteId])

  if (!note) return null

  const photoId = note.photoIds[0] ?? null

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
        {note.tags.length > 0 && (
          <div className="detail-tags">
            {note.tags.map((tag) => (
              <span key={tag} className="tag-chip tag-static">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="none" />
    </div>
  )
}
