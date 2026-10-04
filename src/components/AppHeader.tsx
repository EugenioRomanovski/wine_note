import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../storage/db'
import { PhotoImg } from './PhotoImg'
import { PersonIcon } from './icons'

export function AppHeader() {
  const profile = useLiveQuery(() => db.profile.toCollection().first(), [])
  return (
    <header className="app-header">
      <div>
        <div className="logo">
          <span className="logo-accent">wine</span>note
        </div>
        <div className="logo-sub">мой винный дневник</div>
      </div>
      <Link to="/profile" className="profile-btn" aria-label="Профиль">
        {profile?.avatarPhotoId ? (
          <PhotoImg photoId={profile.avatarPhotoId} alt="Аватар" />
        ) : (
          <PersonIcon size={24} />
        )}
      </Link>
    </header>
  )
}
