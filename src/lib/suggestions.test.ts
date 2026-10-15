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

  it('pads user values with defaults up to 4, skipping duplicates', () => {
    const s = buildSuggestions([
      note('2026-01-02', { grapes: ['Мерло'], tags: ['Сухое'] }),
      note('2026-01-01', { grapes: ['Мерло', 'Пино Нуар'] }),
    ])
    expect(s.grapes).toEqual(['Мерло', 'Пино Нуар', ...SUGGESTED_GRAPES.slice(0, 2)])
    expect(s.tags).toEqual(['Сухое', 'игристое', 'крепленое', 'полу-сухое'])
    expect(s.regions).toEqual(SUGGESTED_REGIONS.slice(0, 4))
  })

  it('uses only user values when there are at least 4', () => {
    const s = buildSuggestions([note('2026-01-01', { grapes: ['a', 'b', 'c', 'd', 'e'] })])
    expect(s.grapes).toHaveLength(4)
    expect(s.grapes.every((g) => 'abcde'.includes(g))).toBe(true)
  })
})
