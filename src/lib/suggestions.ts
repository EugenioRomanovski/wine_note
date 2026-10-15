import type { WineNote } from '../types'
import { SUGGESTED_GRAPES, SUGGESTED_REGIONS, SUGGESTED_TAGS } from './labels'

export const MAX_SUGGESTIONS = 4

/**
 * Самые частые значения из заметок пользователя, не более `limit`.
 * Регистр не учитывается при подсчёте; показывается написание из самой свежей заметки.
 * При равной частоте выше то, что использовалось позже.
 */
export function topValues(lists: string[][], limit = MAX_SUGGESTIONS): string[] {
  const stats = new Map<string, { label: string; count: number; lastSeen: number }>()
  lists.forEach((list, index) => {
    for (const raw of new Set(list.map((v) => v.trim()).filter(Boolean))) {
      const key = raw.toLocaleLowerCase('ru')
      const s = stats.get(key)
      if (s) {
        s.count++
        s.label = raw
        s.lastSeen = index
      } else {
        stats.set(key, { label: raw, count: 1, lastSeen: index })
      }
    }
  })
  return [...stats.values()]
    .sort((a, b) => b.count - a.count || b.lastSeen - a.lastSeen)
    .slice(0, limit)
    .map((s) => s.label)
}

export interface Suggestions {
  grapes: string[]
  regions: string[]
  tags: string[]
}

/**
 * Для первой заметки — стандартные подсказки. Дальше — самые частые значения пользователя;
 * если в каком-то пункте пользователь ещё ничего не вводил, там остаются стандартные.
 */
export function buildSuggestions(notes: WineNote[]): Suggestions {
  const defaults = { grapes: SUGGESTED_GRAPES, regions: SUGGESTED_REGIONS, tags: SUGGESTED_TAGS }
  if (notes.length === 0) return defaults
  const ordered = [...notes].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const pick = (values: string[], fallback: string[]) => (values.length > 0 ? values : fallback)
  return {
    grapes: pick(topValues(ordered.map((n) => n.grapes ?? [])), defaults.grapes),
    regions: pick(topValues(ordered.map((n) => n.regions ?? [])), defaults.regions),
    tags: pick(topValues(ordered.map((n) => n.tags ?? [])), defaults.tags),
  }
}
