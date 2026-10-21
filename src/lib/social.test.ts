import { describe, expect, it } from 'vitest'
import type { WineNote } from '../types'
import { normalizeUsername, usernameError, wineFromNote } from './social'

describe('username', () => {
  it('normalizes input', () => {
    expect(normalizeUsername('  @Anya_K ')).toBe('anya_k')
  })
  it('validates format', () => {
    expect(usernameError('ab')).toMatch(/Минимум/)
    expect(usernameError('a'.repeat(21))).toMatch(/Максимум/)
    expect(usernameError('аня')).toMatch(/латинские/)
    expect(usernameError('anya.k')).toMatch(/латинские/)
    expect(usernameError('@Anya_K')).toBeNull()
  })
})

describe('wineFromNote', () => {
  const note: WineNote = {
    id: 1,
    name: 'Бароло',
    impression: 'want_more',
    color: 'red',
    place: 'Дома',
    comment: 'Очень танинное',
    grapes: ['Неббиоло'],
    regions: ['Пьемонт'],
    tags: ['сухое'],
    photoIds: [3],
    tastedAt: '2026-10-10T19:00:00Z',
    createdAt: 'x',
    updatedAt: 'x',
  }

  it('hides place and comment unless allowed', () => {
    const w = wineFromNote(note, { place: false, comment: false })
    expect(w).toEqual({
      name: 'Бароло',
      impression: 'want_more',
      color: 'red',
      grapes: ['Неббиоло'],
      regions: ['Пьемонт'],
      tags: ['сухое'],
      tastedAt: '2026-10-10T19:00:00Z',
    })
    expect(wineFromNote(note, { place: true, comment: true })).toMatchObject({ place: 'Дома', comment: 'Очень танинное' })
  })
})
