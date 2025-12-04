# Planer

Мобильное приложение-планер, построенное на современном технологическом стеке.

## Технологии

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Cloudflare Workers
- **Mobile**: Capacitor (Android)
- **Build Tools**: Vite 7, Wrangler 4

## Структура проекта

```
planer/
├── src/                    # React frontend source code
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # Application entry point
│   └── assets/            # Static assets (images, styles)
├── worker/                # Cloudflare Worker backend
│   └── index.ts           # Worker API handler
├── android/               # Native Android application
├── dist/                  # Build output
│   ├── client/            # Frontend build
│   └── planer/            # Worker build
├── capacitor.config.ts    # Capacitor configuration
├── wrangler.jsonc         # Cloudflare Workers configuration
└── vite.config.ts         # Vite configuration
```

## Требования

- Node.js 18+
- npm или yarn
- (Опционально) Android Studio для разработки мобильного приложения

## Установка

```bash
npm install
```

## Разработка

### Локальный запуск (с HMR)

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173`

### Превью продакшен-билда

```bash
npm run preview
```

## Сборка

```bash
npm run build
```

Собранные файлы появятся в директории `dist/`:
- `dist/client/` - фронтенд приложение
- `dist/planer/` - Cloudflare Worker

## Деплой

### Cloudflare Workers

```bash
npm run deploy
```

Эта команда:
1. Соберет проект
2. Задеплоит Worker и статические ассеты на Cloudflare

### Генерация типов для Cloudflare

```bash
npm run cf-typegen
```

## Мобильное приложение (Android)

### Синхронизация с Capacitor

```bash
npm run cap:sync
```

### Сборка и открытие в Android Studio

```bash
npm run android
```

Эта команда:
1. Соберет веб-приложение
2. Синхронизирует с Capacitor
3. Откроет проект в Android Studio

### Другие команды для Android

```bash
# Только открыть в Android Studio
npm run cap:open:android

# Собрать и синхронизировать без открытия
npm run cap:build:android

# Запустить на устройстве/эмуляторе
npm run cap:run:android
```

## API

Backend реализован как Cloudflare Worker и предоставляет REST API:

- `GET /api/` - пример endpoint, возвращает `{ name: "Cloudflare" }`

Редактируйте `worker/index.ts` для добавления новых endpoint'ов.

## Линтинг

```bash
npm run lint
```

## Конфигурация

- **Vite**: `vite.config.ts` - конфигурация сборщика и dev-сервера
- **Cloudflare**: `wrangler.jsonc` - конфигурация Worker'а
- **Capacitor**: `capacitor.config.ts` - настройки нативного приложения
- **ESLint**: `eslint.config.js` - правила линтера

### Переменные окружения

Создайте файл `.env` в корне проекта для настройки:

```bash
# API Configuration
# Оставьте пустым для веб-сборки (будет использоваться относительный путь /api)
# Укажите полный домен для кастомных развертываний
VITE_API_BASE_URL=
```

**Автоматическая настройка API для мобильного приложения:**

- Для **веб-версии**: используется относительный путь `/api` (работает с Cloudflare Workers)
- Для **мобильного приложения** (Android/iOS): автоматически используется `https://planer.quicpro.workers.dev/api`
- Можно переопределить через переменную окружения `VITE_API_BASE_URL`

Логика определения API endpoint находится в `src/services/apiClient.ts` и использует Capacitor API для определения платформы.

## Лицензия

Private

