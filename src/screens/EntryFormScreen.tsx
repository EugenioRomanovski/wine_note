import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../storage/db'
import type { Impression, WineColor, WineNote } from '../types'
import { IMPRESSION_LABELS, IMPRESSIONS, SUGGESTED_TAGS, WINE_COLORS } from '../lib/labels'
import { ImpressionIcon } from '../components/ImpressionChip'
import { PhotoImg } from '../components/PhotoImg'
import { CameraIcon, ChevronDownIcon, ChevronUpIcon, PencilIcon, PlusIcon, XIcon } from '../components/icons'

export default function EntryFormScreen() {
  const { id } = useParams()
  const editId = id ? Number(id) : null
  const isEdit = editId != null
  const navigate = useNavigate()

  const existing = useLiveQuery(
    () => (editId != null ? db.notes.get(editId) : Promise.resolve<WineNote | undefined>(undefined)),
    [editId],
  )

  const [initialized, setInitialized] = useState(false)
  const [name, setName] = useState('')
  const [impression, setImpression] = useState<Impression | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [photoId, setPhotoId] = useState<number | null>(null)
  const [place, setPlace] = useState('')
  const [comment, setComment] = useState('')
  const [color, setColor] = useState<WineColor | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isEdit) {
      setInitialized(true)
      return
    }
    if (existing && !initialized) {
      setName(existing.name)
      setImpression(existing.impression)
      setDetailsOpen(true)
      setPhotoId(existing.photoIds[0] ?? null)
      setPlace(existing.place ?? '')
      setComment(existing.comment ?? '')
      setColor(existing.color ?? null)
      setTags(existing.tags)
      setInitialized(true)
    }
  }, [existing, isEdit, initialized])

  const pickPhoto = () => fileRef.current?.click()

  const onPhotoChosen = async (file: File | undefined) => {
    if (!file) return
    const now = new Date().toISOString()
    const newId = (await db.photos.add({ blob: file, createdAt: now })) as number
    setPhotoId(newId)
  }

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/,+$/, '')
    if (tag && !tags.includes(tag)) setTags([...tags, tag])
    setTagInput('')
  }

  const canSave = name.trim().length > 0 && impression != null && !saving

  const save = async () => {
    if (!canSave) return
    setSaving(true)
    const now = new Date().toISOString()
    try {
      if (isEdit) {
        await db.notes.update(editId, {
          name: name.trim(),
          impression,
          place: place.trim() || undefined,
          comment: comment.trim() || undefined,
          color: color ?? undefined,
          tags,
          photoIds: photoId != null ? [photoId] : [],
          updatedAt: now,
        })
        navigate(`/note/${editId}`, { replace: true })
      } else {
        const newId = await db.notes.add({
          name: name.trim(),
          impression,
          place: place.trim() || undefined,
          comment: comment.trim() || undefined,
          color: color ?? undefined,
          tags,
          photoIds: photoId != null ? [photoId] : [],
          tastedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        navigate(`/note/${newId}/success`, { replace: true })
      }
    } finally {
      setSaving(false)
    }
  }

  if (!initialized || (isEdit && !existing)) return null

  return (
    <div className="screen">
      <header className="form-header">
        <button className="cancel" onClick={() => navigate(-1)}>
          Отмена
        </button>
        <div className="form-title">Запись в моменте</div>
      </header>

      <div className="form-section">
        <div className="form-label">
          <span className="num">1</span> Название вина
        </div>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например: оранжевое от Саши или марка с бутылки"
        />
      </div>

      <div className="form-section">
        <div className="form-label">
          <span className="num">2</span> Ваше общее впечатление
        </div>
        <div className="imp-select">
          {IMPRESSIONS.map((imp) => (
            <button
              key={imp}
              className={`imp-option imp-opt-${imp} ${
                impression === imp ? 'selected' : impression == null ? 'tinted' : ''
              }`}
              onClick={() => setImpression(imp)}
            >
              <ImpressionIcon impression={imp} size={18} />
              {IMPRESSION_LABELS[imp]}
            </button>
          ))}
        </div>
      </div>

      <div className="form-section">
        <div className="details-box">
          <button className="details-toggle" onClick={() => setDetailsOpen(!detailsOpen)}>
            <div>
              <div className="dt-title">ДОБАВИТЬ ДЕТАЛИ</div>
              <div className="dt-sub">необязательно</div>
            </div>
            <span className="details-chevron">
              {detailsOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
            </span>
          </button>

          {detailsOpen && (
            <div className="details-body">
              <div className="form-section">
                <div className="form-label">
                  <span className="num">3</span> Снимок этикетки, меню или бокала
                </div>
                <button className="photo-picker" onClick={pickPhoto}>
                  {photoId != null ? (
                    <>
                      <PhotoImg photoId={photoId} className="photo-preview" alt="Фото вина" />
                      <span className="photo-edit-badge">
                        <PencilIcon size={20} />
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="photo-picker-icon">
                        <CameraIcon size={24} />
                      </span>
                      Нажмите, чтобы сделать фото
                    </>
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={(e) => {
                    void onPhotoChosen(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
              </div>

              <div className="form-section">
                <div className="form-label">
                  <span className="num">4</span> Где пили
                </div>
                <input
                  className="input"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder="введите место"
                />
              </div>

              <div className="form-section">
                <div className="form-label">
                  <span className="num">5</span> Ваш комментарий
                </div>
                <textarea
                  className="input"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="введите что почувствовали"
                />
              </div>

              <div className="form-section">
                <div className="form-label">
                  <span className="num">6</span> Цвет вина
                </div>
                <div className="color-chips">
                  {WINE_COLORS.map((c) => (
                    <button
                      key={c.value}
                      className={`color-chip ${color === c.value ? 'selected' : ''}`}
                      onClick={() => setColor(color === c.value ? null : c.value)}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <div className="form-label">
                  <span className="num">7</span> О вине
                </div>
                <input
                  className="input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      addTag(tagInput)
                    }
                  }}
                  onBlur={() => tagInput.trim() && addTag(tagInput)}
                  placeholder="введите сорт винограда, регион или оттенки вкуса"
                />
                <div className="tag-cloud">
                  {tags.map((tag) => (
                    <button key={tag} className="tag-chip tag-user" onClick={() => setTags(tags.filter((t) => t !== tag))}>
                      {tag}
                      <XIcon size={13} />
                    </button>
                  ))}
                  {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
                    <button key={tag} className="tag-chip tag-suggested" onClick={() => addTag(tag)}>
                      {tag}
                      <PlusIcon size={13} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="entry-save">
        <button className="btn-accent" disabled={!canSave} onClick={() => void save()}>
          {isEdit ? 'Сохранить изменения' : 'Сохранить вино в памяти'}
        </button>
      </div>
    </div>
  )
}
