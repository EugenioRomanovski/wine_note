import { useState, type InputHTMLAttributes } from 'react'
import { ChevronRightIcon } from './icons'

interface Props {
  label: string
  value: string
  /** Как показать значение в строке (например, с «@») */
  display?: string
  /** Подсказка под строкой, пока поле редактируется */
  hint?: string
  /** Символ перед полем ввода (например, «@») */
  prefix?: string
  /** Приводит ввод к нужному виду (например, юзернейм — в нижний регистр) */
  transform?: (raw: string) => string
  inputProps?: InputHTMLAttributes<HTMLInputElement>
  /** Сохранить; вернуть текст ошибки, чтобы остаться в редактировании */
  onSave: (draft: string) => Promise<string | null>
}

/** Строка настроек: нажали — значение редактируется прямо в строке, Enter или уход с поля — сохранить. */
export function EditableRow({ label, value, display, hint, prefix, transform, inputProps, onSave }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const start = () => {
    if (editing) return
    setDraft(value)
    setError(null)
    setEditing(true)
  }

  const save = async () => {
    if (busy) return
    if (draft.trim() === value.trim()) {
      setEditing(false)
      return
    }
    setBusy(true)
    try {
      const problem = await onSave(draft)
      setError(problem)
      if (!problem) setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button className="card-row" onClick={start}>
        {label}
        {editing ? (
          <span className="name-edit">
            {prefix && <span className="name-edit-prefix">{prefix}</span>}
            <input
              className="name-edit-input"
              autoFocus
              disabled={busy}
              {...inputProps}
              value={draft}
              onChange={(e) => {
                setDraft(transform ? transform(e.target.value) : e.target.value)
                setError(null)
              }}
              onClick={(e) => e.stopPropagation()}
              onBlur={() => void save()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void save()
                if (e.key === 'Escape') setEditing(false)
              }}
            />
          </span>
        ) : (
          <span className="row-value">
            {display ?? (value || '—')}
            <ChevronRightIcon size={18} />
          </span>
        )}
      </button>
      {editing && (error || hint) && <div className={`row-note${error ? ' row-error' : ''}`}>{error ?? hint}</div>}
    </>
  )
}
