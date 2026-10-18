import rawGrapes from '../data/grapes.json'

export interface Grape {
  /** Русское название — именно оно сохраняется в заметке */
  ru: string
  /** Оригинальное название, как на этикетке */
  orig: string
  synonym: boolean
  /** Русское название основного сорта (для основного — совпадает с ru) */
  main: string
}

interface Indexed extends Grape {
  normRu: string
  normOrig: string
  keyRu: string
  keyOrig: string
}

/** Нижний регистр, ё→е, без диакритики (é→e, ü→u), без пунктуации и лишних пробелов. */
export function normalize(s: string): string {
  return s
    .toLocaleLowerCase('ru')
    .replace(/ё/g, 'е')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/**
 * Фонетический ключ — сглаживает типичные ошибки на слух:
 * о/а, е/и/э/ы/й, мягкий/твёрдый знак, двойные согласные.
 */
export function phoneticKey(s: string): string {
  return normalize(s)
    .replace(/[ьъ]/g, '')
    .replace(/о/g, 'а')
    .replace(/[еэыйи]/g, 'и')
    .replace(/(\p{L})\1+/gu, '$1')
}

/** Расстояние Дамерау–Левенштейна (с перестановкой соседних букв). */
function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }
  return d[a.length][b.length]
}

/** Позиции начала слов в строке. */
function wordStarts(s: string): number[] {
  const starts = [0]
  for (let i = 1; i < s.length; i++) if (s[i - 1] === ' ') starts.push(i)
  return starts
}

/** Сколько опечаток допускаем в зависимости от длины запроса (короткие — только точно). */
function maxTypos(len: number): number {
  if (len < 5) return 0
  if (len < 8) return 1
  return 2
}

/** Наименьшее число опечаток, с которым запрос совпадает с началом какого-нибудь слова в названии. */
function fuzzyPrefixDistance(query: string, name: string): number {
  let best = Infinity
  for (const start of wordStarts(name)) {
    for (const len of [query.length - 1, query.length, query.length + 1]) {
      if (len <= 0 || start + len > name.length + 1) continue
      best = Math.min(best, editDistance(query, name.slice(start, start + len)))
    }
  }
  return best
}

function startsWord(name: string, query: string): boolean {
  return wordStarts(name).some((i) => name.startsWith(query, i))
}

/** Самые распространённые сорта (по убыванию) — при равном совпадении показываем их выше. */
const POPULAR = [
  'Каберне Совиньон', 'Мерло', 'Шардоне', 'Совиньон Блан', 'Пино Нуар', 'Сира', 'Шираз', 'Рислинг',
  'Каберне Фран', 'Пино Гри', 'Пино Гриджо', 'Мальбек', 'Темпранильо', 'Санджовезе', 'Неббиоло',
  'Гренаш', 'Гарнача', 'Шенен Блан', 'Гевюрцтраминер', 'Зинфандель', 'Примитиво', 'Вионье',
  'Мускат', 'Москато', 'Ркацители', 'Саперави', 'Алиготе', 'Пино Блан', 'Семийон', 'Грюнер Вельтлинер',
  'Карменер', 'Гаме', 'Мурведр', 'Монастрель', 'Альбариньо', 'Верментино', 'Глера', 'Барбера',
  'Красностоп Золотовский', 'Цимлянский чёрный', 'Кокур белый', 'Сибирьковый',
]
const popularity = (ru: string) => {
  const i = POPULAR.indexOf(ru)
  return i === -1 ? POPULAR.length : i
}

const GRAPES: Indexed[] = (rawGrapes as [string, string, string][]).map(([ru, orig, main]) => ({
  ru,
  orig,
  synonym: main !== '',
  main: main || ru,
  normRu: normalize(ru),
  normOrig: normalize(orig),
  keyRu: phoneticKey(ru),
  keyOrig: phoneticKey(orig),
}))

function hasWord(name: string, word: string): boolean {
  return name.split(' ').includes(word)
}

/** Чем меньше число, тем выше в списке; null — не подходит. */
function score(g: Indexed, q: string, key: string): number | null {
  if (g.normRu === q || g.normOrig === q) return 0
  if (key && (g.keyRu === key || g.keyOrig === key)) return 1
  if (hasWord(g.normRu, q) || hasWord(g.normOrig, q)) return 2
  if (g.normRu.startsWith(q) || g.normOrig.startsWith(q)) return 3
  if (startsWord(g.normRu, q) || startsWord(g.normOrig, q)) return 4
  if (key && (startsWord(g.keyRu, key) || startsWord(g.keyOrig, key))) return 5
  const typos = maxTypos(key.length)
  if (typos > 0) {
    const d = Math.min(fuzzyPrefixDistance(key, g.keyRu), fuzzyPrefixDistance(key, g.keyOrig))
    if (d <= typos) return 5 + d
  }
  return null
}

/** Подсказки для введённого текста: правильные названия сортов, лучшие сверху. */
export function searchGrapes(input: string, limit = 6): Grape[] {
  const q = normalize(input)
  if (q.length < 2) return []
  const key = phoneticKey(input)
  const found: { g: Indexed; s: number }[] = []
  for (const g of GRAPES) {
    const s = score(g, q, key)
    if (s != null) found.push({ g, s })
  }
  found.sort(
    (a, b) =>
      a.s - b.s ||
      popularity(a.g.ru) - popularity(b.g.ru) ||
      Number(a.g.synonym) - Number(b.g.synonym) ||
      a.g.ru.length - b.g.ru.length ||
      a.g.ru.localeCompare(b.g.ru, 'ru'),
  )
  return found.slice(0, limit).map(({ g }) => toGrape(g))
}

/** Точное совпадение с названием из справочника (без учёта регистра, ё и диакритики). */
export function findExactGrape(input: string): Grape | null {
  const q = normalize(input)
  const g = GRAPES.find((x) => x.normRu === q || x.normOrig === q)
  return g ? toGrape(g) : null
}

const toGrape = (g: Indexed): Grape => ({ ru: g.ru, orig: g.orig, synonym: g.synonym, main: g.main })

/** Основные сорта справочника (без синонимов). */
export const MAIN_GRAPES: Grape[] = GRAPES.filter((g) => !g.synonym).map(toGrape)

/** Основной сорт для названия из заметки: «Шираз» → «Сира». null — сорта нет в справочнике. */
export function resolveMainGrape(name: string): Grape | null {
  const g = findExactGrape(name)
  if (!g) return null
  return g.synonym ? (MAIN_GRAPES.find((m) => m.ru === g.main) ?? null) : g
}
