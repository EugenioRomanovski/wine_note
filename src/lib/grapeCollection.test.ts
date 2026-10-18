import { describe, expect, it } from 'vitest'
import type { WineNote } from '../types'
import { TOTAL_GRAPES, grapeCollection } from './grapeCollection'

const note = (grapes: string[], impression: WineNote['impression'] = 'good') =>
  ({ grapes, impression, tags: [], regions: [], photoIds: [] }) as unknown as WineNote

describe('grapeCollection', () => {
  it('knows the number of main grapes in the dictionary', () => {
    expect(TOTAL_GRAPES).toBe(423)
  })

  it('merges synonyms into the main grape and keeps how they were written', () => {
    const c = grapeCollection([note(['Сира']), note(['Шираз']), note(['Мерло', 'Шираз'], 'not_mine')])
    expect(c).toEqual([
      { ru: 'Сира', orig: 'Syrah', tastings: 3, aliases: ['Шираз'] },
      { ru: 'Мерло', orig: 'Merlot', tastings: 1, aliases: [] },
    ])
  })

  it('counts a grape once per note and ignores grapes outside the dictionary', () => {
    const c = grapeCollection([note(['Шираз', 'Сира', 'Мой домашний сорт'])])
    expect(c).toHaveLength(1)
    expect(c[0].tastings).toBe(1)
  })

  it('accepts any spelling of an exact name', () => {
    const [g] = grapeCollection([note(['chardonnay'])])
    expect(g.ru).toBe('Шардоне')
    expect(g.aliases).toEqual([])
    expect(grapeCollection([note(['шираз'])])[0].aliases).toEqual(['Шираз'])
  })
})
