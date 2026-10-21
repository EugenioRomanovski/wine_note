import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Клиент Supabase или null, если переменные окружения не заданы
 * (тогда приложение работает как раньше, только без аккаунта).
 */
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // вход по коду из письма — ссылок с токенами в адресе нет
          detectSessionInUrl: false,
          storageKey: 'winenote-auth',
        },
      })
    : null
