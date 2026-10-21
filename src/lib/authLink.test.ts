import { describe, expect, it } from 'vitest'
import { parseAuthLink } from './authLink'

describe('parseAuthLink', () => {
  it('reads token_hash and type from the query string', () => {
    expect(parseAuthLink('?token_hash=abc123&type=email')).toEqual({ tokenHash: 'abc123', type: 'email' })
    expect(parseAuthLink('?token_hash=abc&type=signup')).toEqual({ tokenHash: 'abc', type: 'signup' })
  })

  it('falls back to email type and ignores unrelated urls', () => {
    expect(parseAuthLink('?token_hash=abc&type=weird')).toEqual({ tokenHash: 'abc', type: 'email' })
    expect(parseAuthLink('?foo=1')).toBeNull()
    expect(parseAuthLink('')).toBeNull()
  })
})
