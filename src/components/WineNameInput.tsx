import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import type { WineNote } from '../types'
import { WINE_COLORS } from '../lib/labels'
import { normalize } from '../lib/grapeSearch'
import { loadWineIndex, searchNotes, searchWines, type WineIndex, type WineInfo } from '../lib/wineSearch'

interface Props {
  value: string
  onChange: (value: string) => void
  /** Выбрана подсказка — можно заполнить остальные поля */
  onPick: (wine: WineInfo) => void
  /** Свои заметки, от новых к старым — их совпадения показываем первыми */
  notes: WineNote[]
}

const MAX_OPTIONS = 6

type Option = WineInfo & { own: boolean }

function details(w: WineInfo): string {
  const color = WINE_COLORS.find((c) => c.value === w.color)?.label
  return [color ?? w.tags[0], ...w.regions, w.grapes.join(' / ')].filter(Boolean).join(' · ')
}

/** Поле названия вина с подсказками из своих заметок и справочника X-Wines. */
export function WineNameInput({ value, onChange, onPick, notes }: Props) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [index, setIndex] = useState<WineIndex | null>(null)
  const [wantIndex, setWantIndex] = useState(false)
  const query = useDeferredValue(value)

  // Справочник грузим, только когда начали вводить название
  useEffect(() => {
    if (!wantIndex || index) return
    let cancelled = false
    loadWineIndex().then(
      (i) => !cancelled && setIndex(i),
      // Без справочника (нет сети) остаются подсказки из своих заметок
      (e: unknown) => console.warn('Справочник вин не загрузился', e),
    )
    return () => {
      cancelled = true
    }
  }, [wantIndex, index])

  const options = useMemo<Option[]>(() => {
    const text = query.trim()
    if (!text) return []
    const own = searchNotes(notes, text).map((w) => ({ ...w, own: true }))
    const ownNames = new Set(own.map((w) => normalize(w.name)))
    const fromIndex = index
      ? searchWines(index, text, MAX_OPTIONS + own.length)
          .filter((w) => !ownNames.has(normalize(w.name)))
          .map((w) => ({ ...w, own: false }))
      : []
    const list = [...own, ...fromIndex].slice(0, MAX_OPTIONS)
    // Уже выбранное название целиком — список не нужен
    return list.length === 1 && normalize(list[0].name) === normalize(text) ? [] : list
  }, [query, notes, index])

  const showList = open && options.length > 0

  const choose = (opt: Option) => {
    const { own: _own, ...wine } = opt
    onPick(wine)
    setOpen(false)
    setActive(0)
  }

  return (
    <div className="autocomplete">
      <input
        className="input"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setWantIndex(true)
          setOpen(true)
          setActive(0)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (showList && e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((i) => (i + 1) % options.length)
          } else if (showList && e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((i) => (i - 1 + options.length) % options.length)
          } else if (showList && e.key === 'Enter') {
            e.preventDefault()
            choose(options[Math.min(active, options.length - 1)])
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
        placeholder="Марка с бутылки и название из меню"
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
        autoComplete="off"
      />
      {showList && (
        <ul className="autocomplete-list" role="listbox">
          {options.map((opt, i) => (
            <li key={`${opt.own ? 'own' : 'db'}:${opt.name}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={`autocomplete-item${i === active ? ' active' : ''}`}
                // mousedown вместо click: иначе blur поля закроет список раньше
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(opt)
                }}
                onMouseEnter={() => setActive(i)}
              >
                <span className="autocomplete-name">{opt.name}</span>
                <span className="autocomplete-orig">
                  {[opt.own ? 'из ваших записей' : '', details(opt)].filter(Boolean).join(' · ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
