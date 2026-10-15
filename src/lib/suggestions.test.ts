import { describe, expect, it } from 'vitest'
import type { WineNote } from '../types'
import { buildSuggestions, topValues } from './suggestions'
import { SUGGESTED_GRAPES, SUGGESTED_REGIONS, SUGGESTED_TAGS } from './labels'

function note(createdAt: string, fields: Partial<WineNote>): WineNote {
  return {
    name: 'x',
    impression: 'good',
    grapes: [],
    regions: [],
    tags: [],
    photoIds: [],
    tastedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    ...fields,
  }
}

describe('topValues', () => {
  it('returns at most 4 values ordered by frequency', () => {
    expect(topValues([['a', 'b'], ['b', 'c'], ['b', 'c', 'd'], ['e'], ['f']])).toEqual(['b', 'c', 'f', 'e'])
  })

  it('breaks ties by most recent use', () => {
    expect(topValues([['a'], ['b'], ['c']])).toEqual(['c', 'b', 'a'])
  })

  it('counts case-insensitively and keeps the latest spelling', () => {
    expect(topValues([['бургундия'], ['Бургундия'], ['Чили']])).toEqual(['Бургундия', 'Чили'])
  })

  it('counts a value once per note', () => {
    expect(topValues([['a', 'a', 'a'], ['b'], ['b']])).toEqual(['b', 'a'])
  })
})

describe('buildSuggestions', () => {
  it('uses defaults when there are no notes yet', () => {
    expect(buildSuggestions([])).toEqual({
      grapes: SUGGESTED_GRAPES,
      regions: SUGGESTED_REGIONS,
      tags: SUGGESTED_TAGS,
    })
  })

  it('uses user values once notes exist, falling back per field', () => {
    const s = buildSuggestions([
      note('2026-01-02', { grapes: ['Мерло'], tags: ['сухое'] }),
      note('2026-01-01', { grapes: ['Мерло', 'Пино Нуар'] }),
    ])
    expect(s.grapes).toEqual(['Мерло', 'Пино Нуар'])
    expect(s.tags).toEqual(['сухое'])
    expect(s.regions).toEqual(SUGGESTED_REGIONS)
  })
})
