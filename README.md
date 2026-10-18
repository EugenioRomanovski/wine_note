# Wine Note

Приложение для заметок о вине. Пока веб (PWA), в планах — iOS и Android.

## Стек

- **React 19 + TypeScript**, сборка **Vite 6**
- **react-router-dom 7** с `HashRouter` (удобно для будущей упаковки в нативную оболочку)
- **Dexie 4** (IndexedDB) — все данные хранятся локально на устройстве, бэкенда нет
- Чистый CSS с темами светлая/тёмная (`src/theme.css`)
- **Vitest** — юнит-тесты

## Запуск

```bash
npm install
npm run dev        # дев-сервер на http://localhost:5173
npm run typecheck  # проверка типов
npm test           # тесты
npm run build      # продакшен-сборка в dist/
npm run build:grapes  # пересобрать справочник сортов из data/grapes.csv
```

## Структура

```
src/
  screens/     экраны (лента, форма записи, карточка, вкус, профиль)
  components/  переиспользуемые компоненты и иконки
  storage/db.ts  схема IndexedDB (Dexie)
  lib/         даты, подписи, бэкап JSON
  data/        справочник сортов винограда (генерируется из data/grapes.csv)
  types.ts     модель данных
public/        иконки, шрифты, web-манифест
design/        макеты экранов (png) и выгрузка из Figma (json)
```

## Мобильные приложения (план)

Рекомендуемый путь — **Capacitor**: текущий код переиспользуется как есть,
`HashRouter` и локальное хранилище уже совместимы с WebView.
Что понадобится на этом этапе:

- `@capacitor/core`, `@capacitor/cli`, платформы `@capacitor/ios` / `@capacitor/android`
- выбор фото — `@capacitor/camera`; экспорт/шаринг файлов — `@capacitor/filesystem` + `@capacitor/share`
  (скачивание через `<a download>` в WebView не работает)
- для надёжного хранения можно перейти с IndexedDB на SQLite (`@capacitor-community/sqlite`)
- сборка iOS требует macOS + Xcode, Android — Android Studio
