import { useCallback, useEffect, useState } from 'react'
import { getMyUsername, listFriends, listRecommendations, type Friend, type Recommendation } from '../lib/social'

export interface SocialState {
  loading: boolean
  error: string | null
  username: string | null
  friends: Friend[]
  recommendations: Recommendation[]
  reload: () => Promise<void>
}

/** Юзернейм, друзья и рекомендации текущего пользователя (загружаются из Supabase). */
export function useSocial(userId: string | undefined): SocialState {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [friends, setFriends] = useState<Friend[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])

  const reload = useCallback(async () => {
    if (!userId) return
    try {
      const [u, f, r] = await Promise.all([getMyUsername(), listFriends(), listRecommendations()])
      setUsername(u)
      setFriends(f)
      setRecommendations(r)
      setError(null)
    } catch {
      setError('Не удалось загрузить друзей. Проверьте интернет.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    setLoading(true)
    void reload()
  }, [reload])

  return { loading, error, username, friends, recommendations, reload }
}
