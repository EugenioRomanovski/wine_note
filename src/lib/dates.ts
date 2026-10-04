const dayFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const timeFmt = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** "14 мая" or "Вчера, 14 мая" */
export function formatDay(iso: string): string {
  const d = new Date(iso)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (sameDay(d, yesterday)) return `Вчера, ${dayFmt.format(d)}`
  return dayFmt.format(d)
}

/** "14 мая в 20:15" */
export function formatDayTime(iso: string): string {
  const d = new Date(iso)
  return `${dayFmt.format(d)} в ${timeFmt.format(d)}`
}
