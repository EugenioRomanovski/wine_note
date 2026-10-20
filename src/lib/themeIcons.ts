/**
 * Иконка вкладки браузера под тему приложения.
 * Иконка установленного приложения (манифест, apple-touch-icon) всегда тёмная:
 * система запоминает её при установке и сменить на лету её нельзя.
 */
export function applyThemeIcons(theme: 'light' | 'dark') {
  const sfx = theme === 'dark' ? '-dark' : ''
  document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.setAttribute('href', `/icons/favicon-32${sfx}-v2.png`)
}
