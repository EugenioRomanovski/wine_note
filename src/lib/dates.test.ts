import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatDay, formatDayTime } from './dates'

describe('dates', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 15, 12, 0))
  })
  afterEach(() => vi.useRealTimers())

  it('formats a day with a two-digit year', () => {
    expect(formatDay(new Date(2026, 4, 10, 18, 0).toISOString())).toBe('10 мая 26')
  })

  it('prefixes yesterday', () => {
    expect(formatDay(new Date(2026, 4, 14, 20, 15).toISOString())).toBe('Вчера, 14 мая 26')
  })

  it('formats day and time', () => {
    expect(formatDayTime(new Date(2026, 4, 14, 20, 15).toISOString())).toBe('14 мая 26 в 20:15')
  })
})
