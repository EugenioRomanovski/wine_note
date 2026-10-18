import { describe, expect, it } from 'vitest'
import { findExactGrape, normalize, phoneticKey, searchGrapes } from './grapeSearch'

const names = (q: string) => searchGrapes(q).map((g) => g.ru)

describe('normalize', () => {
  it('ignores case, ё and diacritics', () => {
    expect(normalize('Совиньён')).toBe('совиньен')
    expect(normalize('Grüner Veltliner')).toBe('gruner veltliner')
    expect(normalize("Nero d'Avola")).toBe('nero d avola')
  })

  it('builds the same phonetic key for common misspellings', () => {
    expect(phoneticKey('савиньон')).toBe(phoneticKey('совиньон'))
  })
})

describe('searchGrapes', () => {
  it('finds by prefix of the Russian name', () => {
    expect(names('мерл')[0]).toBe('Мерло')
  })

  it('finds by the original name, including without diacritics', () => {
    expect(names('sauvignon')).toContain('Совиньон Блан')
    expect(names('gruner')[0]).toBe('Грюнер Вельтлинер')
  })

  it('finds by a word inside the name', () => {
    expect(searchGrapes('блан', 20).map((g) => g.ru)).toContain('Совиньон Блан')
  })

  it('tolerates misspellings', () => {
    expect(names('савиньон')).toContain('Совиньон Блан')
    expect(names('совеньён')).toContain('Совиньон Блан')
    expect(names('шардонне')[0]).toBe('Шардоне')
    expect(names('каберне совиньен')[0]).toBe('Каберне Совиньон')
  })

  it('ranks main names above synonyms', () => {
    const r = searchGrapes('совинь')
    expect(r.findIndex((g) => g.ru === 'Совиньон Блан')).toBeLessThan(r.findIndex((g) => g.ru === 'Совиньон'))
  })

  it('shows popular grapes first among equal matches', () => {
    expect(names('каберне').slice(0, 2)).toEqual(['Каберне Совиньон', 'Каберне Фран'])
    expect(names('пино').slice(0, 2)).toEqual(['Пино Нуар', 'Пино Гри'])
  })

  it('puts an exact match first, even for a synonym', () => {
    expect(names('шираз')[0]).toBe('Шираз')
  })

  it('returns nothing for too short or unrelated input', () => {
    expect(searchGrapes('с')).toEqual([])
    expect(searchGrapes('кукуруза')).toEqual([])
  })
})

describe('findExactGrape', () => {
  it('maps any spelling of an exact name to the canonical Russian name', () => {
    expect(findExactGrape('мерло')?.ru).toBe('Мерло')
    expect(findExactGrape('Chardonnay')?.ru).toBe('Шардоне')
    expect(findExactGrape('Мерлоо')).toBeNull()
  })
})
