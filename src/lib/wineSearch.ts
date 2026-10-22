import type { WineColor, WineNote } from '../types'
import { normalize } from './grapeSearch'

/** Формат src/data/wines.json (собирается npm run build:wines из X-Wines). */
export interface WineData {
  grapes: string[]
  regions: string[]
  /** [название, тип, индексы сортов, индекс региона] */
  wines: [string, string, number[], number][]
}

export interface WineInfo {
  name: string
  color?: WineColor
  grapes: string[]
  regions: string[]
  tags: string[]
}

interface Entry {
  name: string
  type: string
  grapes: number[]
  region: number
  words: string[]
  /** Звуковые ключи слов — считаются при первом запросе кириллицей */
  keys?: string[][]
}

export interface WineIndex {
  data: WineData
  entries: Entry[]
}

// r красное, w белое, p розовое, s игристое, d десертное, f крепленое
const TYPE_COLOR: Record<string, WineColor | undefined> = { r: 'red', w: 'white', p: 'rose' }
const TYPE_TAG: Record<string, string | undefined> = { s: 'игристое', d: 'сладкое', f: 'крепленое' }

function wineInfo(e: Entry, data: WineData): WineInfo {
  // Игристое розовое — по названию, остальное игристое без цвета
  const color =
    TYPE_COLOR[e.type] ?? (e.type === 's' && e.words.some((w) => w === 'rose' || w === 'rosado') ? 'rose' : undefined)
  const tag = TYPE_TAG[e.type]
  const region = data.regions[e.region]
  return {
    name: e.name,
    color,
    grapes: e.grapes.map((i) => data.grapes[i]),
    regions: region ? [region] : [],
    tags: tag ? [tag] : [],
  }
}

/** normalize() с быстрым путём для названий без диакритики (их большинство). */
function nameWords(name: string): string[] {
  const text = /^[\x20-\x7e]*$/.test(name)
    ? name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    : normalize(name)
  return text.split(' ')
}

export function createWineIndex(data: WineData): WineIndex {
  return {
    data,
    entries: data.wines.map(([name, type, grapes, region]) => ({ name, type, grapes, region, words: nameWords(name) })),
  }
}

const CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'H', ц: 'ts', ч: 'sh', ш: 'sh', щ: 'sh',
  ъ: '', ы: 'i', ь: '', э: 'e', ю: 'iu', я: 'ia',
}

/** Звуковой ключ латинского слова: группы гласных → «a», ts → s, двойные согласные → одна. */
function soundKey(latin: string): string {
  return latin
    .replace(/ts/g, 's')
    .replace(/[aeiouy]+/g, 'a')
    .replace(/(.)\1+/g, '$1')
}

const hasCyrillic = (s: string) => /[а-я]/.test(s)

const labelKeyCache = new Map<string, string[]>()

/** Ключи слова с этикетки — по нескольку для букв, которые читаются по-разному (ch, j). */
function labelKeys(word: string): string[] {
  const cached = labelKeyCache.get(word)
  if (cached) return cached
  // Своя заметка может быть записана по-русски
  if (hasCyrillic(word)) return [typedKey(word)]
  // Немое -x: Margaux → «марго»
  const base = (word.length > 4 && word.endsWith('x') ? word.slice(0, -1) + '\0' : word)
    .replace(/ph/g, 'f')
    .replace(/qu/g, 'k')
    .replace(/ck/g, 'k')
    .replace(/gn/g, 'n')
    .replace(/w/g, 'v')
    .replace(/x/g, 'ks')
    .replace(/z/g, 's')
  let variants = base.endsWith('\0') ? [base.slice(0, -1), base.slice(0, -1) + 'ks'] : [base]
  // h в начале бывает и немым, и «х»: Hugel → «хюгель»
  if (base.startsWith('h')) variants = variants.flatMap((v) => [v, 'H' + v.slice(1)])
  if (base.includes('ch')) variants = variants.flatMap((v) => [v.replace(/s?ch/g, 'sh'), v.replace(/ch/g, 'k')])
  if (base.includes('j')) variants = variants.flatMap((v) => [v.replace(/j/g, 'sh'), v.replace(/j/g, 'H')])
  const keys = [
    ...new Set(
      variants.map((v) =>
        soundKey(
          v
            .replace(/c(?=[eiy])/g, 's')
            .replace(/c/g, 'k')
            // Непроизносимое h: остаётся только в sh; H — произносимое
            .replace(/(?<!s)h/g, '')
            .toLowerCase(),
        ),
      ),
    ),
  ]
  labelKeyCache.set(word, keys)
  return keys
}

/** Ключ слова, набранного кириллицей. */
function typedKey(word: string): string {
  const latin = [...word].map((c) => CYRILLIC[c] ?? c).join('')
  return soundKey(latin.replace(/z/g, 's').toLowerCase())
}

/**
 * Чем меньше, тем выше; null — не подходит. Каждое слово запроса — начало какого-то слова названия.
 * Выше всего — слова подряд с начала названия, затем по порядку; при равенстве — больше слов совпало целиком.
 */
function matchScore(
  query: string[],
  wordCount: number,
  matches: (q: string, word: number) => boolean,
  equals: (q: string, word: number) => boolean,
): number | null {
  let inOrder = true
  let adjacent = true
  let whole = 0
  let last = -1
  for (const q of query) {
    let at = 0
    while (at < wordCount && !matches(q, at)) at++
    if (at === wordCount) return null
    if (at <= last) inOrder = false
    if (at !== last + 1) adjacent = false
    if (equals(q, at)) whole++
    last = at
  }
  const rank = adjacent ? 0 : matches(query[0], 0) && inOrder ? 1 : inOrder ? 2 : 3
  return rank * 100 + (query.length - whole)
}

interface Searchable {
  name: string
  words: string[]
  keys?: string[][]
}

/** Подходящие по названию: лучшие совпадения сверху, при равенстве — короткие названия. */
function rank<T extends Searchable>(items: T[], input: string, limit: number): T[] {
  const q = normalize(input)
  if (q.length < 2) return []
  const cyr = hasCyrillic(q)
  const query = cyr ? q.split(' ').map(typedKey).filter(Boolean) : q.split(' ')
  if (query.length === 0 || query.join('').length < 2) return []

  const found: { item: T; s: number }[] = []
  for (const item of items) {
    let s: number | null
    if (cyr) {
      const keys = (item.keys ??= item.words.map(labelKeys))
      s = matchScore(
        query,
        keys.length,
        (q, i) => keys[i].some((k) => k.startsWith(q)),
        (q, i) => keys[i].includes(q),
      )
    } else {
      const words = item.words
      s = matchScore(
        query,
        words.length,
        (q, i) => words[i].startsWith(q),
        (q, i) => words[i] === q,
      )
    }
    if (s != null) found.push({ item, s })
  }
  found.sort((a, b) => a.s - b.s || a.item.name.length - b.item.name.length)
  return found.slice(0, limit).map((f) => f.item)
}

/** Подсказки из справочника вин. */
export function searchWines(index: WineIndex, input: string, limit = 6): WineInfo[] {
  return rank(index.entries, input, limit).map((e) => wineInfo(e, index.data))
}

/**
 * Подсказки из своих заметок — с теми цветом, сортами и регионами, что записаны в последней из них.
 * Заметки — от новых к старым.
 */
export function searchNotes(notes: WineNote[], input: string, limit = 3): WineInfo[] {
  const seen = new Set<string>()
  const items: (Searchable & { info: WineInfo })[] = []
  for (const n of notes) {
    const key = normalize(n.name)
    if (!key || seen.has(key)) continue
    seen.add(key)
    items.push({
      name: n.name,
      words: key.split(' '),
      info: { name: n.name, color: n.color, grapes: n.grapes ?? [], regions: n.regions ?? [], tags: n.tags ?? [] },
    })
  }
  return rank(items, input, limit).map((i) => i.info)
}

let loading: Promise<WineIndex> | null = null

/** Справочник грузится один раз, при первом вводе названия (~1,4 МБ в сжатом виде). */
export function loadWineIndex(): Promise<WineIndex> {
  loading ??= import('../data/wines.json?url')
    .then(({ default: url }) => fetch(url))
    .then((res) => {
      if (!res.ok) throw new Error(`wines.json: ${res.status}`)
      return res.json() as Promise<WineData>
    })
    .then((data) => {
      const index = createWineIndex(data)
      warmUpKeys(index)
      return index
    })
    .catch((e: unknown) => {
      loading = null
      throw e
    })
  return loading
}

/** Звуковые ключи для поиска кириллицей считаем заранее, понемногу, чтобы не подвешивать ввод. */
function warmUpKeys(index: WineIndex, from = 0) {
  const to = Math.min(from + 2000, index.entries.length)
  for (let i = from; i < to; i++) {
    const e = index.entries[i]
    e.keys ??= e.words.map(labelKeys)
  }
  if (to < index.entries.length) setTimeout(() => warmUpKeys(index, to), 0)
}
