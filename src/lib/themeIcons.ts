/**
 * Иконка вкладки браузера и иконка «На экран Домой» под тему приложения.
 * Уже установленное на телефон приложение так не меняется: система запоминает
 * иконку при установке (в манифесте — светлая версия).
 */
export function applyThemeIcons(theme: 'light' | 'dark') {
  const sfx = theme === 'dark' ? '-dark' : ''
  document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.setAttribute('href', `/icons/favicon-32${sfx}-v2.png`)
  document
    .querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')
    ?.setAttribute('href', `/icons/apple-touch-icon${sfx}-v2.png`)
}
