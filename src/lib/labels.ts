import type { Impression, WineColor } from '../types'

export const IMPRESSION_LABELS: Record<Impression, string> = {
  want_more: 'хочу ещё',
  good: 'хорошо',
  not_mine: 'не моё',
}

export const IMPRESSIONS: Impression[] = ['not_mine', 'good', 'want_more']

export const WINE_COLORS: { value: WineColor; label: string }[] = [
  { value: 'red', label: 'красное' },
  { value: 'white', label: 'белое' },
  { value: 'rose', label: 'розовое' },
  { value: 'orange', label: 'оранж' },
]

export const SUGGESTED_TAGS = ['игристое', 'крепленое', 'сухое', 'полу-сухое', 'сладкое']
