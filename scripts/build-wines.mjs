// Собирает справочник вин для подсказок названия из датасета X-Wines (CC0) → src/data/wines.json.
// Запуск: npm run build:wines -- путь/к/XWines_Full_100K_wines.csv
// Сорта сопоставляются со справочником src/data/grapes.json (npm run build:grapes),
// регионы переводятся по data/wine-regions.csv; если перевода нет — ставится страна.
import { readFileSync, writeFileSync } from 'node:fs'

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      if (row.some((f) => f !== '')) rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  row.push(field)
  if (row.some((f) => f !== '')) rows.push(row)
  return rows
}

/** Как normalize в src/lib/grapeSearch.ts */
const normalize = (s) =>
  s
    .toLocaleLowerCase('ru')
    .replace(/ё/g, 'е')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

const COUNTRIES = {
  Albania: 'Албания', Argentina: 'Аргентина', Armenia: 'Армения', Australia: 'Австралия', Austria: 'Австрия',
  Azerbaijan: 'Азербайджан', Belarus: 'Беларусь', Belgium: 'Бельгия', Bolivia: 'Боливия', Brazil: 'Бразилия',
  Bulgaria: 'Болгария', Canada: 'Канада', Chile: 'Чили', China: 'Китай', Colombia: 'Колумбия', Croatia: 'Хорватия',
  Cyprus: 'Кипр', 'Czech Republic': 'Чехия', Denmark: 'Дания', France: 'Франция', Georgia: 'Грузия',
  Germany: 'Германия', Greece: 'Греция', Hungary: 'Венгрия', India: 'Индия', Israel: 'Израиль', Italy: 'Италия',
  Japan: 'Япония', Jordan: 'Иордания', Lebanon: 'Ливан', Liechtenstein: 'Лихтенштейн', Luxembourg: 'Люксембург',
  Malta: 'Мальта', Mexico: 'Мексика', Moldova: 'Молдова', Montenegro: 'Черногория', Morocco: 'Марокко',
  Myanmar: 'Мьянма', Netherlands: 'Нидерланды', 'New Zealand': 'Новая Зеландия', 'North Macedonia': 'Северная Македония',
  Peru: 'Перу', Poland: 'Польша', Portugal: 'Португалия', Romania: 'Румыния', Russia: 'Россия',
  'San Marino': 'Сан-Марино', Serbia: 'Сербия', Slovakia: 'Словакия', Slovenia: 'Словения', 'South Africa': 'ЮАР',
  Spain: 'Испания', Sweden: 'Швеция', Switzerland: 'Швейцария', Syria: 'Сирия', Thailand: 'Таиланд',
  Tunisia: 'Тунис', Turkey: 'Турция', Ukraine: 'Украина', 'United Kingdom': 'Великобритания',
  'United States': 'США', Uruguay: 'Уругвай',
}

// Тип вина → код в справочнике: r красное, w белое, p розовое, s игристое, d десертное, f крепленое
const TYPES = { Red: 'r', White: 'w', 'Rosé': 'p', Sparkling: 's', Dessert: 'd', 'Dessert/Port': 'f' }

// Приставки цвета и уточнения, без которых сорт находится в справочнике: «Gamay Noir» → «Gamay»
const GRAPE_SUFFIX = /\s+(noir|blanc|bianco|branco|blanca|preto|tinto|bijeli|crni|gris|de .+|of .+)$/i

const csvPath = process.argv[2]
if (!csvPath) throw new Error('Укажите путь к CSV X-Wines: npm run build:wines -- XWines_Full_100K_wines.csv')

const [header, ...rows] = parseCsv(readFileSync(csvPath, 'utf8').replace(/^﻿/, ''))
const col = (name) => {
  const i = header.indexOf(name)
  if (i === -1) throw new Error(`В CSV нет колонки ${name}`)
  return i
}
const NAME = col('WineName')
const TYPE = col('Type')
const GRAPES = col('Grapes')
const COUNTRY = col('Country')
const REGION = col('RegionName')
const WINERY = col('WineryName')

// Справочник сортов: нормализованное русское или оригинальное название → русское название
const grapeIndex = new Map()
for (const [ru, orig] of JSON.parse(readFileSync('src/data/grapes.json', 'utf8'))) {
  for (const key of [normalize(ru), normalize(orig)]) if (!grapeIndex.has(key)) grapeIndex.set(key, ru)
}
const findGrape = (name) => {
  for (const variant of [name, ...name.split('/')]) {
    for (const v of [variant, variant.replace(GRAPE_SUFFIX, '')]) {
      const ru = grapeIndex.get(normalize(v))
      if (ru) return ru
    }
  }
  return null
}

const [regionHeader, ...regionRows] = parseCsv(readFileSync('data/wine-regions.csv', 'utf8').replace(/^﻿/, ''))
if (regionHeader[0] !== 'Оригинал' || regionHeader[1] !== 'По-русски') throw new Error('Неверный заголовок data/wine-regions.csv')
const regionRu = new Map(regionRows.map(([orig, ru]) => [orig.trim(), ru.trim()]))

/** Строки из питоновского списка: "['Merlot', \"Nero d'Avola\"]" */
const parseList = (s) => [...s.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)].map((m) => (m[1] ?? m[2]).trim())

const grapeNames = []
const grapeIds = new Map()
const regionNames = []
const regionIds = new Map()
const intern = (list, ids, value) => {
  if (!ids.has(value)) {
    ids.set(value, list.length)
    list.push(value)
  }
  return ids.get(value)
}

const seen = new Set()
const wines = []
let grapeTotal = 0
let grapeMatched = 0
let regionMatched = 0
for (const r of rows) {
  const winery = r[WINERY].trim()
  const wine = r[NAME].trim()
  const nw = normalize(wine)
  const nwinery = normalize(winery)
  // Название в карточке — как на этикетке: винодельня + вино, без повтора винодельни
  const name = !nwinery || nw.includes(nwinery) ? wine : nwinery.includes(nw) ? winery : `${winery} ${wine}`
  const key = normalize(name)
  if (!key || seen.has(key)) continue
  seen.add(key)

  const type = TYPES[r[TYPE].trim()]
  if (!type) throw new Error(`Неизвестный тип вина: ${r[TYPE]}`)

  const grapes = []
  for (const g of parseList(r[GRAPES])) {
    grapeTotal++
    const ru = findGrape(g)
    if (ru) grapeMatched++
    const label = ru ?? g
    if (!grapes.includes(label)) grapes.push(label)
  }

  let region = regionRu.get(r[REGION].trim())
  if (region) regionMatched++
  else region = COUNTRIES[r[COUNTRY].trim()]
  if (!region) throw new Error(`Нет перевода страны: ${r[COUNTRY]}`)

  wines.push([name, type, grapes.map((g) => intern(grapeNames, grapeIds, g)), intern(regionNames, regionIds, region)])
}

const out = JSON.stringify({ grapes: grapeNames, regions: regionNames, wines })
writeFileSync('src/data/wines.json', out + '\n')
const pct = (a, b) => `${Math.round((a / b) * 100)}%`
console.log(
  `src/data/wines.json: ${wines.length} вин, ${(out.length / 1e6).toFixed(1)} МБ; ` +
    `сорта из справочника — ${pct(grapeMatched, grapeTotal)}, регион переведён — ${pct(regionMatched, wines.length)}`,
)
