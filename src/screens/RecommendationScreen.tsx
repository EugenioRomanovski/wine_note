import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { deleteRecommendation, listRecommendations, type Recommendation } from '../lib/social'
import { formatDay, formatDayTime } from '../lib/dates'
import { WINE_COLORS } from '../lib/labels'
import { ImpressionChip } from '../components/ImpressionChip'
import { BottomNav } from '../components/BottomNav'
import { ArrowLeftIcon, BagIcon, PinIcon, TrashIcon } from '../components/icons'
import { useRecPhotoUrl } from '../hooks/useRecPhotoUrl'

const who = (name: string | null, username: string | null) =>
  [name?.trim(), username ? `@${username}` : null].filter(Boolean).join(' · ') || 'друг'

/** Полная карточка вина, которое посоветовал друг (только просмотр). */
export default function RecommendationScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  // из списка в профиле карточка приходит сразу, без ожидания сети
  const passed = (useLocation().state as { rec?: Recommendation } | null)?.rec
  // загруженная карточка запоминается вместе с id, чтобы при переходе на другую не показать старую
  const [loaded, setLoaded] = useState<{ id: string; rec: Recommendation | null } | null>(null)
  const [error, setError] = useState(false)
  const rec: Recommendation | null | undefined =
    passed?.id === id ? passed : loaded && loaded.id === id ? loaded.rec : undefined

  useEffect(() => {
    if (rec !== undefined || !id) return
    setError(false)
    listRecommendations()
      .then((all) => setLoaded({ id, rec: all.find((r) => r.id === id) ?? null }))
      .catch(() => setError(true))
  }, [id, rec])

  const photoUrl = useRecPhotoUrl(rec?.photoPath)

  const remove = async () => {
    if (!window.confirm('Удалить рекомендацию?')) return
    await deleteRecommendation(id!)
    navigate('/profile', { replace: true })
  }

  const back = (
    <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Назад">
      <ArrowLeftIcon size={20} />
    </button>
  )

  if (rec === undefined || rec === null) {
    return (
      <div className="screen with-nav">
        <div className="detail-plain-actions">{back}</div>
        <div className="account-muted">
          {error ? 'Не удалось загрузить. Проверьте интернет.' : rec === null ? 'Рекомендация не найдена — возможно, её удалили.' : 'Загрузка…'}
        </div>
        <BottomNav active="none" />
      </div>
    )
  }

  const w = rec.wine
  const colorLabel = WINE_COLORS.find((c) => c.value === w.color)?.label
  const chips = [
    ...(w.grapes?.length ? [w.grapes.join('/')] : []),
    ...(colorLabel ? [colorLabel] : []),
    ...(w.tags ?? []),
    ...(w.regions ?? []),
  ]

  return (
    <div className="screen with-nav">
      {rec.photoPath ? (
        <div className="detail-hero">
          {photoUrl && <img src={photoUrl} alt={w.name} />}
          <button className="hero-btn back" onClick={() => navigate(-1)} aria-label="Назад">
            <ArrowLeftIcon size={20} />
          </button>
          <button className="hero-btn delete" onClick={() => void remove()} aria-label="Удалить рекомендацию">
            <TrashIcon size={18} />
          </button>
        </div>
      ) : (
        <div className="detail-plain-actions">
          {back}
          <button className="icon-btn" onClick={() => void remove()} aria-label="Удалить рекомендацию">
            <TrashIcon size={18} />
          </button>
        </div>
      )}

      <div className="detail-body">
        <div className="rec-detail-from">
          Советует <b>{who(rec.senderName, rec.senderUsername)}</b> · {formatDay(rec.createdAt)}
        </div>
        <div className="row-between">
          <ImpressionChip impression={w.impression} />
          {w.tastedAt && <span className="note-date">{formatDayTime(w.tastedAt)}</span>}
        </div>
        <h1 className="detail-title">{w.name}</h1>
        {w.place && (
          <div className="note-place">
            <PinIcon size={16} />
            {w.place}
          </div>
        )}
        {w.boughtAt && (
          <div className="note-place note-bought">
            <BagIcon size={16} />
            Купили: {w.boughtAt}
          </div>
        )}
        {rec.message && (
          <div className="comment-card">
            <div className="comment-card-title">Сообщение</div>
            <div className="comment-card-text">«{rec.message}»</div>
          </div>
        )}
        {w.comment && (
          <div className="comment-card">
            <div className="comment-card-title">Комментарий друга</div>
            <div className="comment-card-text">«{w.comment}»</div>
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
      </div>

      <BottomNav active="none" />
    </div>
  )
}
