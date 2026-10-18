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
if ([RU, ORIG, TYPE].includes(-1)) throw new Error('Не найдены нужные колонки в data/grapes.csv')

// [русское название, оригинальное название, 1 если синоним]
const grapes = rows
  .map((r) => [r[RU].trim(), r[ORIG].trim(), r[TYPE].trim() === 'синоним' ? 1 : 0])
  .filter(([ru]) => ru)
  .sort((a, b) => a[0].localeCompare(b[0], 'ru'))

writeFileSync('src/data/grapes.json', JSON.stringify(grapes) + '\n')
console.log(`src/data/grapes.json: ${grapes.length} сортов`)
