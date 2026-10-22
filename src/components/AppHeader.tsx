import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../storage/db'
import { PhotoImg } from './PhotoImg'
import { HeartIcon, PersonIcon } from './icons'
import { useNewRecommendations } from '../hooks/useNewRecommendations'
import { plural } from '../lib/stats'

export function AppHeader() {
  const profile = useLiveQuery(() => db.profile.toCollection().first(), [])
  const newRecs = useNewRecommendations()
  return (
    <header className="app-header">
      <div>
        <div className="logo">
          <span className="logo-accent">wine</span>note
        </div>
        <div className="logo-sub">мой винный дневник</div>
      </div>
      <div className="profile-btn-wrap">
        <Link
          to="/profile"
          className="profile-btn"
          aria-label={
            newRecs > 0
              ? `Профиль: ${newRecs} ${plural(newRecs, ['новая рекомендация', 'новые рекомендации', 'новых рекомендаций'])}`
              : 'Профиль'
          }
        >
          {profile?.avatarPhotoId ? (
            <PhotoImg photoId={profile.avatarPhotoId} alt="Аватар" />
          ) : (
            <PersonIcon size={24} />
          )}
        </Link>
        {newRecs > 0 && (
          <span className="rec-badge" aria-hidden="true">
            <HeartIcon size={12} />
          </span>
        )}
      </div>
    </header>
  )
}
