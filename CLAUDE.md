# Wine Note — заметки для Claude

Local-first приложение для заметок о вине: React 19 + TS + Vite, Dexie (IndexedDB), HashRouter.
Свой бэкенд — только Supabase (проект `winenote`): аккаунт, профиль, друзья и рекомендации; записи о винах хранятся локально. Интерфейс на русском. Позже будет упаковано в iOS/Android (план — Capacitor),
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

## Supabase
- Клиент — `src/lib/supabase.ts` (null, если нет `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`;
  приложение тогда работает без аккаунта). Значения публичные: `.env.example`, на Vercel — env vars.
- Вход — email + одноразовый код (`signInWithOtp` / `verifyOtp`). В письме также ссылка
  `https://wine-note-one.vercel.app/?token_hash={{ .TokenHash }}&type=email` — параметры до `#`,
  чтобы не конфликтовать с HashRouter; её обрабатывает `src/components/AuthLinkHandler.tsx`.
  Стандартный `{{ .ConfirmationURL }}` не использовать (токены в `#` ломают маршруты).
  Шаблоны писем (Magic Link и Confirm signup) должны содержать `{{ .Token }}` и эту ссылку.
- Профиль (имя, аватар) синхронизируется: таблица `profiles` + приватный бакет `avatars`
  (`<user id>/avatar.jpg`), RLS — только свои данные. Логика — `src/lib/profileSync.ts`
  (побеждает последнее изменение, `Profile.updatedAt`).
- Друзья и рекомендации — `src/lib/social.ts`: `profiles.username` (уникальный, `^[a-z0-9_]{3,20}$`),
  таблицы `friendships` (pending/accepted, одна запись на пару) и `recommendations` (копия вина
  в jsonb, отправить можно только другу — RLS). Чужие профили напрямую не читаются: только через
  функции `find_user` (точный юзернейм), `send_friend_request`, `respond_friend_request`,
  `my_friends`, `my_recommendations` (security definer, фильтруют по `auth.uid()`).
- Коннектор Supabase не выполняет `drop`/`alter policy` без подтверждения пользователя (таймаут):
  такие изменения — только по согласованию.
- Схема базы: миграции в `supabase/migrations/` (имя файла = версия из `list_migrations`).
  Применяются через коннектор Supabase, файл в репозитории — копия для истории.
- Секретный ключ (service_role) в клиентский код не попадает никогда.

## Git
- Владелец проекта разрешил коммитить и пушить прямо в `main`, без отдельных веток и PR.
  Перед пушем обязательно: `npm run typecheck && npm test && npm run build`.
