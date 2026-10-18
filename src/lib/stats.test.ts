import { describe, expect, it } from 'vitest'
import type { WineNote } from '../types'
import { plural, pluralWines, tastedCounts } from './stats'

describe('pluralWines', () => {
  it.each([
    [0, 'вин'], [1, 'вино'], [2, 'вина'], [4, 'вина'], [5, 'вин'], [11, 'вин'],
    [12, 'вин'], [14, 'вин'], [21, 'вино'], [22, 'вина'], [111, 'вин'], [101, 'вино'],
  ])('%i → %s', (n, word) => {
    expect(pluralWines(n)).toBe(word)
  })
})

describe('tastedCounts', () => {
  const note = (d: Date) => ({ tastedAt: d.toISOString() }) as WineNote

  it('counts notes in the current month and year', () => {
    const now = new Date(2026, 9, 18)
    const notes = [
      note(new Date(2026, 9, 1)),
      note(new Date(2026, 9, 17, 23, 30)),
      note(new Date(2026, 8, 30)),
      note(new Date(2026, 0, 5)),
      note(new Date(2025, 9, 10)),
    ]
    expect(tastedCounts(notes, now)).toEqual({ month: 2, year: 4 })
  })
})

describe('plural', () => {
  it('picks the right form for grapes', () => {
    const f: [string, string, string] = ['сорт', 'сорта', 'сортов']
    expect([1, 2, 5, 11, 21, 423].map((n) => plural(n, f))).toEqual(['сорт', 'сорта', 'сортов', 'сортов', 'сорт', 'сорта'])
  })
})
