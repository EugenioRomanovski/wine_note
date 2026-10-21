import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { authErrorMessage, isValidEmail } from '../lib/authErrors'
import { useAuth } from '../hooks/useAuth'

const RESEND_SECONDS = 60

/** Вход и регистрация по почте с одноразовым кодом (Supabase Auth). */
export function AccountCard() {
  const session = useAuth()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  if (!supabase) {
    return <div className="account-card account-muted">Вход временно недоступен.</div>
  }
  const auth = supabase.auth
  if (session === undefined) return <div className="account-card account-muted">Загрузка…</div>

  if (session) {
    const signOut = async () => {
      setBusy(true)
      await auth.signOut()
      setBusy(false)
      setStep('email')
      setCode('')
    }
    return (
      <div className="account-card">
        <div className="account-label">Вы вошли как</div>
        <div className="account-email">{session.user.email}</div>
        <button className="btn-outline account-btn" disabled={busy} onClick={() => void signOut()}>
          Выйти
        </button>
      </div>
    )
  }

  const sendCode = async () => {
    if (!isValidEmail(email)) {
      setError('Похоже, в адресе почты ошибка.')
      return
    }
    setBusy(true)
    setError(null)
    // если аккаунта ещё нет, Supabase создаст его — вход и регистрация одним шагом
    const { error } = await auth.signInWithOtp({ email: email.trim() })
    setBusy(false)
    if (error) return setError(authErrorMessage(error))
    setStep('code')
    setCode('')
    setCooldown(RESEND_SECONDS)
  }

  const verify = async () => {
    setBusy(true)
    setError(null)
    const { error } = await auth.verifyOtp({ email: email.trim(), token: code, type: 'email' })
    setBusy(false)
    if (error) setError(authErrorMessage(error))
  }

  if (step === 'code') {
    return (
      <div className="account-card">
        <div className="account-text">
          Мы отправили код на <b>{email.trim()}</b>. Введите его ниже — письмо может прийти в течение минуты,
          проверьте и «Спам».
        </div>
        <input
          className="input account-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="Код из письма"
          maxLength={10}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && code.length >= 6 && void verify()}
          autoFocus
        />
        {error && <div className="account-error">{error}</div>}
        <button className="btn-accent account-btn" disabled={busy || code.length < 6} onClick={() => void verify()}>
          {busy ? 'Проверяем…' : 'Войти'}
        </button>
        <div className="account-links">
          <button className="btn-text" disabled={busy || cooldown > 0} onClick={() => void sendCode()}>
            {cooldown > 0 ? `Новый код через ${cooldown} с` : 'Отправить новый код'}
          </button>
          <button
            className="btn-text"
            onClick={() => {
              setStep('email')
              setError(null)
            }}
          >
            Изменить почту
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="account-card">
      <div className="account-text">
        Войдите, чтобы делиться винами с друзьями. Записи по-прежнему хранятся на этом устройстве.
      </div>
      <input
        className="input"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="Электронная почта"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && void sendCode()}
      />
      {error && <div className="account-error">{error}</div>}
      <button className="btn-accent account-btn" disabled={busy || !email.trim()} onClick={() => void sendCode()}>
        {busy ? 'Отправляем…' : 'Получить код'}
      </button>
      <div className="account-hint">Нет аккаунта — он создастся автоматически. Пароль не нужен.</div>
    </div>
  )
}
