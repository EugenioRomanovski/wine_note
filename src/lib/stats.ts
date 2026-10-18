import type { WineNote } from '../types'

/** Русская форма слова для числа: plural(5, ['вино', 'вина', 'вин']) → 'вин' */
export function plural(n: number, [one, few, many]: [string, string, string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

/** 1 вино, 2 вина, 5 вин, 21 вино, 112 вин */
export function pluralWines(n: number): string {
  return plural(n, ['вино', 'вина', 'вин'])
}

/** Сколько вин попробовано в текущем месяце и году (по дате дегустации, местное время). */
export function tastedCounts(notes: WineNote[], now = new Date()): { month: number; year: number } {
  let month = 0
  let year = 0
  for (const note of notes) {
    const d = new Date(note.tastedAt)
    if (d.getFullYear() !== now.getFullYear()) continue
    year++
    if (d.getMonth() === now.getMonth()) month++
  }
  return { month, year }
}
