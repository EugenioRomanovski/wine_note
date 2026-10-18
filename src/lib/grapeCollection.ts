import type { WineNote } from '../types'
import { MAIN_GRAPES, findExactGrape, resolveMainGrape } from './grapeSearch'

/** Сколько всего основных сортов в справочнике */
export const TOTAL_GRAPES = MAIN_GRAPES.length

export interface CollectedGrape {
  /** Русское название основного сорта */
  ru: string
  orig: string
  /** В скольких заметках встречается */
  tastings: number
  /** Синонимы, под которыми сорт записан в заметках: «Шираз» для «Сира» */
  aliases: string[]
}

/**
 * Открытые сорта: все сорта из заметок (включая «не моё»), сведённые к основному сорту
 * справочника. Сорта не из справочника не учитываются.
 */
export function grapeCollection(notes: WineNote[]): CollectedGrape[] {
  const byMain = new Map<string, CollectedGrape>()
  for (const note of notes) {
    const seenInNote = new Set<string>()
    for (const name of note.grapes ?? []) {
      const main = resolveMainGrape(name)
      if (!main) continue
      let entry = byMain.get(main.ru)
      if (!entry) {
        entry = { ru: main.ru, orig: main.orig, tastings: 0, aliases: [] }
        byMain.set(main.ru, entry)
      }
      if (!seenInNote.has(main.ru)) {
        entry.tastings++
        seenInNote.add(main.ru)
      }
      const written = findExactGrape(name)
      if (written && written.synonym && !entry.aliases.includes(written.ru)) entry.aliases.push(written.ru)
    }
  }
  return [...byMain.values()].sort((a, b) => b.tastings - a.tastings || a.ru.localeCompare(b.ru, 'ru'))
}

/**
 * Самый частый сорт в заметках, сведённый к основному сорту справочника
 * («Шираз» и «Сира» — один сорт). Сорта не из справочника считаются по написанию.
 * При равенстве побеждает тот, что встретился раньше в списке заметок.
 */
export function topGrape(notes: WineNote[]): string | null {
  const counts = new Map<string, number>()
  for (const note of notes) {
    const inNote = new Set((note.grapes ?? []).map((g) => resolveMainGrape(g)?.ru ?? g.trim()).filter(Boolean))
    for (const g of inNote) counts.set(g, (counts.get(g) ?? 0) + 1)
  }
  let best: string | null = null
  let bestCount = 0
  for (const [g, c] of counts) {
    if (c > bestCount) {
      best = g
      bestCount = c
    }
  }
  return best
}
