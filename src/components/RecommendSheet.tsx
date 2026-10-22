import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { WineNote } from '../types'
import { db } from '../storage/db'
import { PhotoImg } from './PhotoImg'
import { listFriends, sendRecommendation, wineFromNote, type Friend } from '../lib/social'
import { XIcon } from './icons'

interface Props {
  note: WineNote
  onClose: () => void
  onSent: (friendName: string) => void
}

/** Шторка: выбрать друга и отправить ему рекомендацию вина. */
export function RecommendSheet({ note, onClose, onSent }: Props) {
  const [friends, setFriends] = useState<Friend[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [withComment, setWithComment] = useState(false)
  const [withPlace, setWithPlace] = useState(false)
  const photoId = note.photoIds[0] ?? null
  const [withPhoto, setWithPhoto] = useState(photoId != null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listFriends()
      .then((all) => setFriends(all.filter((f) => f.status === 'accepted')))
      .catch(() => setError('Не удалось загрузить друзей. Проверьте интернет.'))
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const send = async () => {
    const friend = friends?.find((f) => f.userId === selected)
    if (!friend) return
    setBusy(true)
    setError(null)
    try {
      const photo = withPhoto && photoId != null ? (await db.photos.get(photoId))?.blob : undefined
      await sendRecommendation(
        friend.userId,
        wineFromNote(note, { place: withPlace, comment: withComment }),
        message,
        photo,
      )
      onSent(friend.displayName || (friend.username ? `@${friend.username}` : 'другу'))
    } catch {
      setError('Не удалось отправить. Проверьте интернет.')
      setBusy(false)
    }
  }

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet sheet-list" role="dialog" aria-modal="true" aria-labelledby="rec-title">
        <div className="sheet-handle" />
        <button className="sheet-close" onClick={onClose} aria-label="Закрыть">
          <XIcon size={18} />
        </button>
        <div className="sheet-title" id="rec-title">
          Порекомендовать другу
        </div>
        <p className="sheet-sub">«{note.name}»</p>

        {friends === null && !error && <div className="account-muted">Загрузка…</div>}
        {friends?.length === 0 && (
          <div className="account-muted">
            У вас пока нет друзей в приложении.{' '}
            <Link to="/profile" onClick={onClose}>
              Добавить в профиле
            </Link>
          </div>
        )}
        {friends && friends.length > 0 && (
          <div className="rec-sheet-body">
            <div className="rec-friend-list" role="radiogroup">
              {friends.map((f) => (
                <button
                  key={f.userId}
                  role="radio"
                  aria-checked={selected === f.userId}
                  className={`rec-friend ${selected === f.userId ? 'active' : ''}`}
                  onClick={() => setSelected(f.userId)}
                >
                  <span className="rec-friend-name">{f.displayName || 'Без имени'}</span>
                  {f.username && <span className="rec-friend-user">@{f.username}</span>}
                </button>
              ))}
            </div>
            <textarea
              className="input rec-message-input"
              placeholder="Сообщение (необязательно)"
              maxLength={500}
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {photoId != null && (
              <label className="rec-check">
                <input type="checkbox" checked={withPhoto} onChange={(e) => setWithPhoto(e.target.checked)} />
                <PhotoImg photoId={photoId} className="rec-check-thumb" alt="" />
                Приложить фото
              </label>
            )}
            {note.comment && (
              <label className="rec-check">
                <input type="checkbox" checked={withComment} onChange={(e) => setWithComment(e.target.checked)} />
                Добавить мой комментарий
              </label>
            )}
            {note.place && (
              <label className="rec-check">
                <input type="checkbox" checked={withPlace} onChange={(e) => setWithPlace(e.target.checked)} />
                Указать, где пили
              </label>
            )}
          </div>
        )}
        {error && <div className="account-error">{error}</div>}
        {friends && friends.length > 0 && (
          <button className="btn-accent rec-send" disabled={busy || !selected} onClick={() => void send()}>
            {busy ? 'Отправляем…' : 'Отправить'}
          </button>
        )}
      </div>
    </>
  )
}
