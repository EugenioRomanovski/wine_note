import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../storage/db'
import { exportBackup, exportCsv, importBackup } from '../lib/export'
import { BottomNav } from '../components/BottomNav'
import { PhotoImg } from '../components/PhotoImg'
import {
  CameraIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CloudIcon,
  DownloadIcon,
  LockIcon,
  PersonIcon,
} from '../components/icons'

export default function ProfileScreen() {
  const profile = useLiveQuery(() => db.profile.toCollection().first(), [])
  const notes = useLiveQuery(() => db.notes.toArray(), [])
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [backupOpen, setBackupOpen] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)
  const restoreRef = useRef<HTMLInputElement>(null)

  if (!profile || !notes) return null

  const tagCounts = new Map<string, number>()
  for (const note of notes) {
    for (const tag of note.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
  }
  const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag)

  const setTheme = async (dark: boolean) => {
    await db.profile.update(profile.id!, { theme: dark ? 'dark' : 'light' })
  }

  const onAvatarChosen = async (file: File | undefined) => {
    if (!file) return
    const photoId = (await db.photos.add({ blob: file, createdAt: new Date().toISOString() })) as number
    await db.profile.update(profile.id!, { avatarPhotoId: photoId })
  }

  const saveName = async () => {
    const name = nameDraft.trim()
    if (name) await db.profile.update(profile.id!, { name })
    setEditingName(false)
  }

  const onRestore = async (file: File | undefined) => {
    if (!file) return
    if (!window.confirm('Восстановление заменит все текущие данные. Продолжить?')) return
    try {
      await importBackup(file)
      setBackupOpen(false)
    } catch {
      window.alert('Не удалось восстановить данные из этого файла')
    }
  }

  return (
    <div className="screen with-nav">
      <div className="profile-head">
        <div className="avatar-wrap">
          <button className="avatar" onClick={() => avatarRef.current?.click()} aria-label="Сменить фото">
            {profile.avatarPhotoId ? (
              <PhotoImg photoId={profile.avatarPhotoId} alt="Аватар" />
            ) : (
              <PersonIcon size={48} />
            )}
          </button>
          <button
            className="avatar-badge"
            onClick={() => avatarRef.current?.click()}
            aria-label="Сменить фото"
          >
            <CameraIcon size={16} />
          </button>
        </div>
        <input
          ref={avatarRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            void onAvatarChosen(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <div className="profile-name">{profile.name || 'Без имени'}</div>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-label">Твой сорт</div>
          <div className="stat-value">{topTags[0] ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Твой регион</div>
          <div className="stat-value">{topTags[1] ?? '—'}</div>
        </div>
      </div>

      <div className="profile-section-title">Настройки</div>
      <div className="card-list">
        <div className="card-row">
          Тема оформления
          <button
            className={`switch ${profile.theme === 'dark' ? 'on' : ''}`}
            onClick={() => void setTheme(profile.theme !== 'dark')}
            aria-label="Тёмная тема"
            role="switch"
            aria-checked={profile.theme === 'dark'}
          />
        </div>
        <button
          className="card-row"
          onClick={() => {
            if (!editingName) {
              setNameDraft(profile.name)
              setEditingName(true)
            }
          }}
        >
          Имя
          {editingName ? (
            <input
              className="name-edit-input"
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={() => void saveName()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void saveName()
              }}
            />
          ) : (
            <span className="row-value">
              {profile.name || '—'}
              <ChevronRightIcon size={18} />
            </span>
          )}
        </button>
      </div>

      <div className="profile-section-title">Данные</div>
      <div className="card-list">
        <button className="card-row" onClick={() => void exportCsv()}>
          Экспорт в CSV
          <span className="row-icon">
            <DownloadIcon size={20} />
          </span>
        </button>
        <button className="card-row" onClick={() => setBackupOpen(!backupOpen)}>
          Бэкап и восстановление
          <span className="row-icon">
            {backupOpen ? <ChevronDownIcon size={18} /> : <CloudIcon size={20} />}
          </span>
        </button>
        {backupOpen && (
          <div className="backup-actions">
            <button className="btn-accent" onClick={() => void exportBackup()}>
              Скачать бэкап
            </button>
            <button className="btn-outline" onClick={() => restoreRef.current?.click()}>
              Восстановить из файла
            </button>
          </div>
        )}
        <input
          ref={restoreRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            void onRestore(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      <div className="locked-card">
        <div className="locked-head">
          <div className="locked-title">Годовой отчёт</div>
          <span className="row-icon">
            <LockIcon size={22} />
          </span>
        </div>
        <div className="locked-text">
          Появится, когда накопится достаточно записей. Продолжайте исследовать вина!
        </div>
      </div>

      <BottomNav active="none" />
    </div>
  )
}
