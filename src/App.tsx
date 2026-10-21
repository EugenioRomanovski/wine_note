import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './storage/db'
import { applyThemeIcons } from './lib/themeIcons'
import { AuthLinkHandler } from './components/AuthLinkHandler'
import { useAuth } from './hooks/useAuth'
import { syncProfile } from './lib/profileSync'
import FeedScreen from './screens/FeedScreen'
import EntryFormScreen from './screens/EntryFormScreen'
import SuccessScreen from './screens/SuccessScreen'
import NoteDetailScreen from './screens/NoteDetailScreen'
import TasteScreen from './screens/TasteScreen'
import ProfileScreen from './screens/ProfileScreen'

export default function App() {
  const profile = useLiveQuery(() => db.profile.toCollection().first(), [])

  useEffect(() => {
    db.profile.count().then((count) => {
      if (count === 0) return db.profile.add({ name: '', theme: 'light' })
    })
  }, [])

  // имя и аватар синхронизируются с Supabase: при входе, при запуске и когда появилась сеть
  const userId = useAuth()?.user.id
  const profileId = profile?.id
  useEffect(() => {
    // на новом устройстве локальный профиль создаётся при первом запуске — ждём его
    if (!userId || profileId == null) return
    void syncProfile()
    const onOnline = () => void syncProfile()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [userId, profileId])

  useEffect(() => {
    const theme = profile?.theme ?? 'light'
    document.documentElement.dataset.theme = theme
    applyThemeIcons(theme)
  }, [profile?.theme])

  return (
    <div className="app-shell">
      <AuthLinkHandler />
      <Routes>
        <Route path="/" element={<FeedScreen />} />
        <Route path="/taste" element={<TasteScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/new" element={<EntryFormScreen />} />
        <Route path="/note/:id" element={<NoteDetailScreen />} />
        <Route path="/note/:id/edit" element={<EntryFormScreen />} />
        <Route path="/note/:id/success" element={<SuccessScreen />} />
      </Routes>
    </div>
  )
}
