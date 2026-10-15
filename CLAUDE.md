# Wine Note — заметки для Claude

Local-first приложение для заметок о вине: React 19 + TS + Vite, Dexie (IndexedDB), HashRouter.
Бэкенда нет. Интерфейс на русском. Позже будет упаковано в iOS/Android (план — Capacitor),
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
- Формат бэкапа (`src/lib/export.ts`) должен оставаться совместимым с уже сделанными бэкапами.
- Стили — обычный CSS с переменными темы (`src/theme.css`), без CSS-фреймворков.
- Макеты экранов — `design/img/*.png` (светлая и `_dark` версии).

## Git
- Владелец проекта разрешил коммитить и пушить прямо в `main`, без отдельных веток и PR.
  Перед пушем обязательно: `npm run typecheck && npm test && npm run build`.
