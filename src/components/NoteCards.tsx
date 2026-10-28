import { Link } from 'react-router-dom'
import type { WineNote } from '../types'
import { formatDay } from '../lib/dates'
import { ImpressionChip } from './ImpressionChip'
import { PhotoImg } from './PhotoImg'
import { BagIcon, PinIcon } from './icons'

/** Где пили, а если не указано — где купили. */
function NoteWhere({ note, iconSize }: { note: WineNote; iconSize: number }) {
  const text = note.place || note.boughtAt
  if (!text) return null
  const Icon = note.place ? PinIcon : BagIcon
  return (
    <div className="note-place">
      <Icon size={iconSize} />
      {text}
    </div>
  )
}

function firstPhoto(note: WineNote): number | null {
  return note.photoIds.length > 0 ? note.photoIds[0] : null
}

export function NoteCardFull({ note }: { note: WineNote }) {
  const photoId = firstPhoto(note)
  return (
    <Link to={`/note/${note.id}`} className="note-card">
      {photoId != null && <PhotoImg photoId={photoId} className="note-card-photo" alt={note.name} />}
      <div className="note-card-body">
        <ImpressionChip impression={note.impression} />
        <div className="note-title">{note.name}</div>
        <NoteWhere note={note} iconSize={15} />
        {note.comment && <div className="note-comment">«{note.comment}»</div>}
        <span className="note-date">{formatDay(note.tastedAt)}</span>
      </div>
    </Link>
  )
}

export function NoteCardShort({ note }: { note: WineNote }) {
  const photoId = firstPhoto(note)
  return (
    <Link to={`/note/${note.id}`} className="note-short">
      {photoId != null && (
        <PhotoImg photoId={photoId} className="note-short-thumb" alt={note.name} />
      )}
      <div className="note-short-body">
        <div className="note-short-title">{note.name}</div>
        <NoteWhere note={note} iconSize={14} />
        <div className="row-between">
          <ImpressionChip impression={note.impression} />
          <span className="note-date">{formatDay(note.tastedAt)}</span>
        </div>
      </div>
    </Link>
  )
}
