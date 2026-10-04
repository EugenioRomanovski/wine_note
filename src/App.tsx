import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './storage/db'
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

  useEffect(() => {
    document.documentElement.dataset.theme = profile?.theme ?? 'light'
  }, [profile?.theme])

  return (
    <div className="app-shell">
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
