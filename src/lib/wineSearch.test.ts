import { describe, expect, it } from 'vitest'
import type { WineNote } from '../types'
import { createWineIndex, searchNotes, searchWines, type WineData } from './wineSearch'

const data: WineData = {
  grapes: ['Каберне Совиньон', 'Мерло', 'Пино Нуар', 'Шардоне', 'Санджовезе', 'Темпранильо'],
  regions: ['Марго', 'Шампань', 'Тоскана', 'Риоха', 'Рибера-дель-Дуэро'],
  wines: [
    ['Château Margüi Coteaux Varois en Provence Blanc', 'w', [3], 0],
    ['Château Margaux (Premier Grand Cru Classé)', 'r', [0, 1], 0],
    ['Château Siran Margaux', 'r', [0, 1], 0],
    ['Moët & Chandon Impérial Rosé Brut Champagne', 's', [2, 3], 1],
    ['Moët & Chandon Impérial Brut Champagne', 's', [2, 3], 1],
    ['Mateus Rosé', 'p', [], 0],
    ['Antinori Tignanello', 'r', [4, 0], 2],
    ['Vega Sicilia Unico', 'r', [5], 4],
    ['La Rioja Alta Viña Ardanza', 'r', [5], 3],
    ['Taylor’s 10 Year Old Tawny Port', 'f', [], 0],
  ],
}
const index = createWineIndex(data)
const names = (q: string) => searchWines(index, q).map((w) => w.name)

describe('searchWines', () => {
  it('находит по началу слов латиницей, без диакритики', () => {
    expect(names('moet imp')[0]).toBe('Moët & Chandon Impérial Brut Champagne')
    expect(names('tigna')).toEqual(['Antinori Tignanello'])
  })

  it('слова подряд с начала названия — выше', () => {
    expect(names('chateau margaux')[0]).toBe('Château Margaux (Premier Grand Cru Classé)')
    expect(names('margaux')[0]).toBe('Château Siran Margaux')
  })

  it('понимает название, набранное кириллицей', () => {
    expect(names('шато марго')[0]).toBe('Château Margaux (Premier Grand Cru Classé)')
    expect(names('вега сицилия')).toEqual(['Vega Sicilia Unico'])
    expect(names('тинья')).toEqual(['Antinori Tignanello'])
    expect(names('риоха альта')).toEqual(['La Rioja Alta Viña Ardanza'])
    expect(names('моет')[0]).toMatch(/^Moët/)
  })

  it('не ищет по одной букве', () => {
    expect(names('m')).toEqual([])
    expect(names(' ')).toEqual([])
  })

  it('заполняет цвет, сорта, регион и тип', () => {
    expect(searchWines(index, 'margaux')[0]).toEqual({
      name: 'Château Siran Margaux',
      color: 'red',
      grapes: ['Каберне Совиньон', 'Мерло'],
      regions: ['Марго'],
      tags: [],
    })
    const rose = searchWines(index, 'moet imperial rose')[0]
    expect(rose).toMatchObject({ color: 'rose', tags: ['игристое'] })
    expect(searchWines(index, 'moet imperial brut')[0]).toMatchObject({ color: undefined, tags: ['игристое'] })
    expect(searchWines(index, 'tawny')[0]).toMatchObject({ color: undefined, tags: ['крепленое'] })
  })
})

describe('searchNotes', () => {
  const note = (name: string, extra: Partial<WineNote> = {}): WineNote => ({
    name,
    impression: 'good',
    grapes: [],
    regions: [],
    tags: [],
    photoIds: [],
    tastedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  })

  it('берёт данные из самой свежей заметки с таким названием', () => {
    const notes = [
      note('Абрау-Дюрсо Брют', { color: 'white', tags: ['игристое'] }),
      note('абрау-дюрсо брют', { color: 'rose' }),
      note('Шабли'),
    ]
    expect(searchNotes(notes, 'абрау')).toEqual([
      { name: 'Абрау-Дюрсо Брют', color: 'white', grapes: [], regions: [], tags: ['игристое'] },
    ])
  })
})
