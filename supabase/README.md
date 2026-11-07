# Supabase

С 07.11.2026 Wine Note живёт в **общем проекте** приложений автора (`uvuifuyozscfcowuxdtr`,
бывший «encore»): один аккаунт, профиль и друзья на все приложения.

- Приложение обращается к `https://api.brainsome.app` — прокси к проекту (без VPN `*.supabase.co`
  доступен не везде); подробнее — `docs/BACKEND.md` в encore.
- Общее ядро — схема `public`: `profiles` (`user_id`, `username`, `display_name`, `avatar_url`),
  `friendships`, функции `find_user`, `my_friends`, `send_friend_request(p_username)`,
  `respond_friend_request`. Аватары — публичный бакет `avatars`.
- Wine Note — схема `winenote`: таблица `recommendations`, функция `my_recommendations()`,
  бакет `winenote-rec-photos`.
- Миграции общего проекта и полное описание архитектуры (как добавить новое приложение,
  настройки писем и Redirect URLs) — в репозитории **encore**: `supabase/migrations/`, `docs/BACKEND.md`.

`old-winenote-project/` — миграции старого отдельного проекта `zhgtrtqrhcsvcbidnuoe` (история;
данные из него перенесены в общий проект).
