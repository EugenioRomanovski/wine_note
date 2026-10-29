import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../storage/db'
import { BackupError, exportBackup, importBackup } from '../lib/backup'
import { plural } from '../lib/stats'
import { syncProfile } from '../lib/profileSync'
import type { FeedView } from '../types'
import { BottomNav } from '../components/BottomNav'
import { PhotoImg } from '../components/PhotoImg'
import { AccountCard } from '../components/AccountCard'
import { FriendsSection, RecommendationsSection, UsernameRow, useProfileSocial } from '../components/ProfileSocial'
import { EditableRow } from '../components/EditableRow'
import { AvatarCropper } from '../components/AvatarCropper'
import {
  CameraIcon,
  ChevronDownIcon,
  CloudIcon,
  GridViewIcon,
  ListViewIcon,
  LockIcon,
  PersonIcon,
} from '../components/icons'

export default function ProfileScreen() {
  const profile = useLiveQuery(() => db.profile.toCollection().first(), [])
  const social = useProfileSocial()
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [backupOpen, setBackupOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const avatarRef = useRef<HTMLInputElement>(null)
  const restoreRef = useRef<HTMLInputElement>(null)

  if (!profile) return null

  const setTheme = async (dark: boolean) => {
    await db.profile.update(profile.id!, { theme: dark ? 'dark' : 'light' })
  }

  const setFeedView = async (feedView: FeedView) => {
    await db.profile.update(profile.id!, { feedView })
  }
  const feedView = profile.feedView ?? 'full'

  const saveAvatar = async (blob: Blob) => {
    setCropFile(null)
    const photoId = (await db.photos.add({ blob, createdAt: new Date().toISOString() })) as number
    await db.profile.update(profile.id!, { avatarPhotoId: photoId, updatedAt: new Date().toISOString() })
    void syncProfile()
  }

  const saveName = async (draft: string) => {
    const name = draft.trim()
    if (!name) return 'Имя не может быть пустым'
    await db.profile.update(profile.id!, { name, updatedAt: new Date().toISOString() })
    void syncProfile()
    return null
  }

  const onExport = async () => {
    setBusy('Готовим архив…')
    try {
      await exportBackup()
    } catch {
      window.alert('Не удалось создать бэкап')
    } finally {
      setBusy(null)
    }
  }

  const onRestore = async (file: File | undefined) => {
    if (!file) return
    if (!window.confirm('Восстановление заменит все текущие данные. Продолжить?')) return
    setBusy('Восстанавливаем…')
    try {
      const r = await importBackup(file)
      setBackupOpen(false)
      window.alert(
        `Восстановлено: ${r.notes} ${plural(r.notes, ['запись', 'записи', 'записей'])}, ` +
          `${r.photos} ${plural(r.photos, ['фото', 'фото', 'фото'])}`,
      )
    } catch (e) {
      window.alert(e instanceof BackupError ? e.message : 'Не удалось восстановить данные из этого файла')
    } finally {
      setBusy(null)
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
            const file = e.target.files?.[0]
            if (file) setCropFile(file)
            e.target.value = ''
          }}
        />
        <div className="profile-name">{profile.name || 'Без имени'}</div>
      </div>
      {cropFile && <AvatarCropper file={cropFile} onCancel={() => setCropFile(null)} onDone={(b) => void saveAvatar(b)} />}

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
        <div className="card-row">
          Отображение ленты
          <div className="segmented" role="radiogroup" aria-label="Отображение ленты">
            <button
              className={`view-toggle ${feedView === 'full' ? 'active' : ''}`}
              onClick={() => void setFeedView('full')}
              role="radio"
              aria-checked={feedView === 'full'}
              aria-label="Полный вид"
              title="Полный вид"
            >
              <GridViewIcon size={19} />
            </button>
            <button
              className={`view-toggle ${feedView === 'short' ? 'active' : ''}`}
              onClick={() => void setFeedView('short')}
              role="radio"
              aria-checked={feedView === 'short'}
              aria-label="Сокращённый вид"
              title="Сокращённый вид"
            >
              <ListViewIcon size={19} />
            </button>
          </div>
        </div>
        <EditableRow label="Имя" value={profile.name} onSave={saveName} />
        {social && <UsernameRow social={social} />}
      </div>

      {social && <FriendsSection social={social} />}
      {social && <RecommendationsSection social={social} />}

      <div className="profile-section-title">Аккаунт</div>
      <AccountCard />

      <div className="profile-section-title">Данные</div>
      <div className="card-list">
        <button className="card-row" onClick={() => setBackupOpen(!backupOpen)}>
          Бэкап и восстановление
          <span className="row-icon">
            {backupOpen ? <ChevronDownIcon size={18} /> : <CloudIcon size={20} />}
          </span>
        </button>
        {backupOpen && (
          <div className="backup-actions">
            <button className="btn-accent" disabled={busy != null} onClick={() => void onExport()}>
              {busy ?? 'Скачать бэкап'}
            </button>
            <button className="btn-outline" disabled={busy != null} onClick={() => restoreRef.current?.click()}>
              Восстановить
            </button>
            <p className="backup-hint">
              Архив .zip со всеми записями и фото — фото внутри разложены по папкам. Старые бэкапы .json
              тоже можно восстановить.
            </p>
          </div>
        )}
        <input
          ref={restoreRef}
          type="file"
          accept=".zip,application/zip,.json,application/json"
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
