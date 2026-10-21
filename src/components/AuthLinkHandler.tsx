import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AUTH_LINK_ERROR_KEY, parseAuthLink } from '../lib/authLink'
import { authErrorMessage } from '../lib/authErrors'

// ссылка одноразовая: не проверяем её повторно (StrictMode вызывает эффекты дважды)
let handled = false

/** Вход по ссылке из письма: проверяет токен из адреса, убирает его и открывает профиль. */
export function AuthLinkHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    if (handled || !supabase) return
    const link = parseAuthLink(window.location.search)
    if (!link) return
    handled = true
    // токен больше не нужен в адресе — ни в истории, ни при перезагрузке
    window.history.replaceState(null, '', window.location.pathname + '#/profile')
    supabase.auth.verifyOtp({ token_hash: link.tokenHash, type: link.type }).then(({ error }) => {
      try {
        if (error) sessionStorage.setItem(AUTH_LINK_ERROR_KEY, authErrorMessage(error))
        else sessionStorage.removeItem(AUTH_LINK_ERROR_KEY)
      } catch {
        /* хранилище недоступно — просто без сообщения */
      }
      navigate('/profile', { replace: true })
    })
  }, [navigate])

  return null
}
