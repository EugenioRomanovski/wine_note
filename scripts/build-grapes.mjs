// Собирает справочник сортов для подсказок из data/grapes.csv → src/data/grapes.json.
// Запуск: npm run build:grapes
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

const [header, ...rows] = parseCsv(readFileSync('data/grapes.csv', 'utf8').replace(/^﻿/, ''))
const col = (name) => header.indexOf(name)
const RU = col('Название (рус.)')
const ORIG = col('Название (ориг., как на этикетке)')
const TYPE = col('Тип записи')
const MAIN = col('Основной сорт')
if ([RU, ORIG, TYPE, MAIN].includes(-1)) throw new Error('Не найдены нужные колонки в data/grapes.csv')

const entries = rows
  .map((r) => ({ ru: r[RU].trim(), orig: r[ORIG].trim(), main: r[MAIN].trim(), synonym: r[TYPE].trim() === 'синоним' }))
  .filter((e) => e.ru)

// Основной сорт указан оригинальным названием — находим его русскую запись
const mainByOrig = new Map(entries.filter((e) => !e.synonym).map((e) => [e.main, e.ru]))
const missing = entries.filter((e) => e.synonym && !mainByOrig.has(e.main))
if (missing.length > 0) {
  throw new Error('Нет основной записи для синонимов: ' + missing.map((e) => `${e.ru} → ${e.main}`).join(', '))
}

// [русское название, оригинальное название, русское название основного сорта ('' — это и есть основной)]
const grapes = entries
  .map((e) => [e.ru, e.orig, e.synonym ? mainByOrig.get(e.main) : ''])
  .sort((a, b) => a[0].localeCompare(b[0], 'ru'))

writeFileSync('src/data/grapes.json', JSON.stringify(grapes) + '\n')
const mains = grapes.filter((g) => !g[2]).length
console.log(`src/data/grapes.json: ${grapes.length} записей, ${mains} основных сортов`)
