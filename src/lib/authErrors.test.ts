import { describe, expect, it } from 'vitest'
import { authErrorMessage, isValidEmail } from './authErrors'

describe('authErrorMessage', () => {
  it('explains rate limits, expired codes and network errors in Russian', () => {
    expect(authErrorMessage({ code: 'over_email_send_rate_limit' })).toMatch(/Слишком много/)
    expect(authErrorMessage({ status: 429 })).toMatch(/Слишком много/)
    expect(authErrorMessage({ code: 'otp_expired', message: 'Token has expired or is invalid' })).toMatch(/Код неверный/)
    expect(authErrorMessage(new TypeError('Failed to fetch'))).toMatch(/Нет связи/)
    expect(authErrorMessage(null)).toMatch(/Не получилось/)
  })
})

describe('isValidEmail', () => {
  it('accepts normal addresses and rejects broken ones', () => {
    expect(isValidEmail(' me@example.com ')).toBe(true)
    expect(isValidEmail('me@example')).toBe(false)
    expect(isValidEmail('me example.com')).toBe(false)
  })
})
