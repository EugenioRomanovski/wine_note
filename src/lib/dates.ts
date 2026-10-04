const dayFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const timeFmt = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** "14 мая" → "14 мая 26" (две последние цифры года) */
function withYear(d: Date): string {
  return `${dayFmt.format(d)} ${String(d.getFullYear()).slice(-2)}`
}

/** "14 мая 26" or "Вчера, 14 мая 26" */
export function formatDay(iso: string): string {
  const d = new Date(iso)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (sameDay(d, yesterday)) return `Вчера, ${withYear(d)}`
  return withYear(d)
}

/** "14 мая 26 в 20:15" */
export function formatDayTime(iso: string): string {
  const d = new Date(iso)
  return `${withYear(d)} в ${timeFmt.format(d)}`
}
