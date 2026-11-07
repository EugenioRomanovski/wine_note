# Wine Note — заметки для Claude

Local-first приложение для заметок о вине: React 19 + TS + Vite, Dexie (IndexedDB), HashRouter.
Свой бэкенд — только Supabase (общий проект приложений автора): аккаунт, профиль, друзья и рекомендации; записи о винах хранятся локально. Интерфейс на русском. Позже будет упаковано в iOS/Android (план — Capacitor),
поэтому избегай веб-only API без фолбэка и не переходи на BrowserRouter.

## Команды
- `npm run dev` — дев-сервер
- `npm run typecheck` — tsc (strict, noUnusedLocals/Parameters)
- `npm test` — vitest (тесты рядом с кодом, `*.test.ts`)
- `npm run build` — tsc + vite build

Перед коммитом: `npm run typecheck && npm test`.

## Код
- Экраны в `src/screens`, компоненты в `src/components`, утилиты в `src/lib`.
- Модель данных — `src/types.ts`; схема БД — `src/storage/db.ts`. При изменении индексов
  добавляй новую `db.version(n)` с миграцией, не меняй существующую версию.
- Бэкап — `src/lib/backup.ts`: ZIP (fflate) с `data.json` и фото по папкам. Старые бэкапы
  (JSON-формат 1, ZIP-формат 2) должны продолжать восстанавливаться.
- Стили — обычный CSS с переменными темы (`src/theme.css`), без CSS-фреймворков.
- Макеты экранов — `design/img/*.png` (светлая и `_dark` версии).
- Справочник сортов для подсказок: исходник `data/grapes.csv` → `npm run build:grapes` →
  `src/data/grapes.json` (генерируется, руками не править). Поиск — `src/lib/grapeSearch.ts`.
- Справочник вин для подсказок названия — датасет X-Wines (CC0, ~100 тыс. вин; CSV в репозиторий
  не кладём): `npm run build:wines -- путь/к/XWines_Full_100K_wines.csv` → `src/data/wines.json`
  (генерируется; сорта сопоставляются с `grapes.json`, регионы переводятся по `data/wine-regions.csv`,
  без перевода — страна). Файл грузится отдельно (`?url`) при первом вводе названия.
  Поиск — `src/lib/wineSearch.ts` (латиница — по началу слов, кириллица — по звучанию),
  поле — `src/components/WineNameInput.tsx`: сначала свои заметки, выбор заполняет пустые поля.

## Supabase
- Проект **общий** для приложений автора (Wine Note, Encore, …; `uvuifuyozscfcowuxdtr`): один аккаунт,
  профиль и друзья. Общее — схема `public`, своё — схема `winenote` (`client().schema('winenote')`).
  Архитектура, правила и миграции — в репозитории encore (`docs/BACKEND.md`, `supabase/migrations/`);
  здесь — `supabase/README.md`. Таблицы других приложений не трогать.
- Клиент — `src/lib/supabase.ts` (null, если нет `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`;
  приложение тогда работает без аккаунта). Значения публичные: `.env.example`, на Vercel — env vars.
- Вход — email + одноразовый код (`signInWithOtp` с `emailRedirectTo` = адрес Wine Note / `verifyOtp`).
  Шаблон письма общий для всех приложений: код `{{ .Token }}` и ссылка
  `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email` — параметры до `#`, чтобы не конфликтовать
  с HashRouter; её обрабатывает `src/components/AuthLinkHandler.tsx`. Стандартный `{{ .ConfirmationURL }}`
  не использовать (токены в `#` ломают маршруты). Адрес Wine Note должен быть в Redirect URLs.
- Профиль (имя, аватар) — общая таблица `public.profiles` (`user_id`, `username` может быть пустым,
  `display_name`, `avatar_url`) + публичный бакет `avatars` (`<user id>/avatar-<время>.jpg`).
  Логика — `src/lib/profileSync.ts` (побеждает последнее изменение, `Profile.updatedAt`).
- Друзья — общие для всех приложений (`public.friendships`, функции `find_user`, `my_friends`,
  `send_friend_request(p_username)` — ответ переводится `mapFriendRequestResult`, `respond_friend_request`).
  Юзернейм уникален на все приложения; Wine Note разрешает задать только `^[a-z0-9_]{3,20}$`.
  Рекомендации — `winenote.recommendations` (копия вина в jsonb, отправить можно только другу — RLS
  через `private.are_friends`), список полученных — `winenote.my_recommendations()`. Логика — `src/lib/social.ts`.
- Фото рекомендаций — приватный бакет `winenote-rec-photos` (`<sender id>/<recommendation id>.jpg`,
  уменьшается до 1280 px); видят отправитель и получатель; `photo_path` обязан лежать в папке
  отправителя (check-constraint). Показ — через `createSignedUrl` (`recPhotoUrl`).
- Коннектор Supabase не выполняет `drop`/`alter policy` без подтверждения пользователя (таймаут):
  такие изменения — только по согласованию.
- Секретный ключ (service_role) в клиентский код не попадает никогда.

## Git
- Владелец проекта разрешил коммитить и пушить прямо в `main`, без отдельных веток и PR.
  Перед пушем обязательно: `npm run typecheck && npm test && npm run build`.
