/** Понятный текст ошибки Supabase Auth для пользователя. */
export function authErrorMessage(error: unknown): string {
  const e = error as { code?: string; status?: number; message?: string } | null
  const code = e?.code ?? ''
  const msg = (e?.message ?? '').toLowerCase()
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || e?.status === 429) {
    return 'Слишком много попыток. Подождите немного и попробуйте снова.'
  }
  if (code === 'otp_expired' || msg.includes('expired') || msg.includes('invalid')) {
    return 'Код неверный или устарел. Проверьте письмо или запросите новый код.'
  }
  if (code === 'email_address_invalid' || msg.includes('email address') || msg.includes('invalid format')) {
    return 'Похоже, в адресе почты ошибка.'
  }
  if (msg.includes('fetch') || msg.includes('network')) {
    return 'Нет связи с сервером. Проверьте интернет.'
  }
  return 'Не получилось. Попробуйте ещё раз.'
}

export const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
