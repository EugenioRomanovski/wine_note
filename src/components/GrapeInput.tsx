import { useMemo, useState } from 'react'
import { findExactGrape, searchGrapes } from '../lib/grapeSearch'

interface Props {
  value: string
  onChange: (value: string) => void
  /** Добавить сорт в заметку */
  onAdd: (name: string) => void
  /** Уже выбранные сорта — их в подсказках не показываем */
  selected: string[]
}

type Option = { kind: 'grape'; ru: string; orig: string } | { kind: 'raw'; text: string }

/** Поле ввода сорта с подсказками правильных названий из справочника. */
export function GrapeInput({ value, onChange, onAdd, selected }: Props) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const options = useMemo<Option[]>(() => {
    const text = value.trim()
    if (!text) return []
    const found = searchGrapes(text).filter((g) => !selected.includes(g.ru))
    const list: Option[] = found.map((g) => ({ kind: 'grape', ru: g.ru, orig: g.orig }))
    // Сорта нет в справочнике — даём добавить как есть
    if (found.length > 0 && !findExactGrape(text)) list.push({ kind: 'raw', text })
    return list
  }, [value, selected])

  const showList = open && options.length > 0

  /** Введённый текст → правильное название, если оно точно есть в справочнике. */
  const canonical = (text: string) => findExactGrape(text)?.ru ?? text

  const choose = (opt: Option) => {
    onAdd(opt.kind === 'grape' ? opt.ru : opt.text)
    setActive(0)
  }

  return (
    <div className="autocomplete">
      <input
        className="input"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setActive(0)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (showList && e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((i) => (i + 1) % options.length)
          } else if (showList && e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((i) => (i - 1 + options.length) % options.length)
          } else if (e.key === 'Escape') {
            setOpen(false)
          } else if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            if (showList) choose(options[Math.min(active, options.length - 1)])
            else if (value.trim()) onAdd(canonical(value))
          }
        }}
        onBlur={() => {
          setOpen(false)
          if (value.trim()) onAdd(canonical(value))
        }}
        placeholder="введите сорт"
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
      />
      {showList && (
        <ul className="autocomplete-list" role="listbox">
          {options.map((opt, i) => (
            <li key={opt.kind === 'grape' ? opt.ru : `raw:${opt.text}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={`autocomplete-item${i === active ? ' active' : ''}`}
                // mousedown вместо click: иначе blur поля успеет добавить сырой текст
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(opt)
                }}
                onMouseEnter={() => setActive(i)}
              >
                {opt.kind === 'grape' ? (
                  <>
                    <span className="autocomplete-name">{opt.ru}</span>
                    <span className="autocomplete-orig">{opt.orig}</span>
                  </>
                ) : (
                  <span className="autocomplete-raw">Добавить как есть: «{opt.text}»</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
