import type { EmailOtpType } from '@supabase/supabase-js'

const TYPES: EmailOtpType[] = ['email', 'magiclink', 'signup']

/**
 * Ссылка входа из письма: «https://…/?token_hash=…&type=email».
 * Параметры стоят до «#», чтобы не мешать маршрутам HashRouter.
 */
export function parseAuthLink(search: string): { tokenHash: string; type: EmailOtpType } | null {
  const params = new URLSearchParams(search)
  const tokenHash = params.get('token_hash')
  if (!tokenHash) return null
  const raw = params.get('type') as EmailOtpType | null
  return { tokenHash, type: raw && TYPES.includes(raw) ? raw : 'email' }
}

export const AUTH_LINK_ERROR_KEY = 'winenote-auth-link-error'
