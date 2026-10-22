import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../storage/db'
import { countNewRecommendations } from '../lib/social'
import { useAuth } from './useAuth'

const POLL_MS = 2 * 60 * 1000

/** Сколько непросмотренных рекомендаций от друзей (0, если не вошли или нет сети). */
export function useNewRecommendations(): number {
  const userId = useAuth()?.user.id
  const profile = useLiveQuery(() => db.profile.toCollection().first(), [])
  const seenAt = profile?.recsSeenAt
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!userId || !profile) {
      setCount(0)
      return
    }
    let active = true
    const check = () =>
      countNewRecommendations(seenAt)
        .then((n) => active && setCount(n))
        .catch(() => {
          /* нет сети — метку не показываем и не трогаем */
        })
    void check()
    const onVisible = () => document.visibilityState === 'visible' && void check()
    document.addEventListener('visibilitychange', onVisible)
    const timer = setInterval(check, POLL_MS)
    return () => {
      active = false
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(timer)
    }
  }, [userId, seenAt, profile])

  return count
}
