# Настройка API для мобильного приложения

## Что было сделано

Реализована автоматическая настройка API endpoint в зависимости от платформы:

1. **Для веб-версии**: используется относительный путь `/api`
2. **Для мобильного приложения**: автоматически используется `https://planer.quicpro.workers.dev/api`

## Как это работает

### Измененные файлы

#### `src/services/apiClient.ts`

Добавлен импорт Capacitor и логика определения API base URL:

```typescript
import { Capacitor } from '@capacitor/core';

const getApiBaseUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  
  // If VITE_API_BASE_URL is explicitly set, use it
  if (baseUrl) {
    return `${baseUrl}/api`;
  }
  
  // For native mobile apps, use the full domain
  if (Capacitor.isNativePlatform()) {
    return 'https://planer.quicpro.workers.dev/api';
  }
  
  // For web builds, use relative path
  return '/api';
};
```

### Логика работы

1. **Приоритет 1**: Если установлена переменная окружения `VITE_API_BASE_URL`, используется она
2. **Приоритет 2**: Если приложение запущено на нативной платформе (Android/iOS), используется полный домен
3. **Приоритет 3**: Для веб-версии используется относительный путь

## Использование

### Веб-версия (разработка)

```bash
npm run dev
```

API запросы: `http://localhost:5173/api/*`

### Веб-версия (продакшн)

```bash
npm run deploy
```

API запросы: `https://planer.quicpro.workers.dev/api/*`

### Мобильное приложение

```bash
npm run android
```

API запросы: `https://planer.quicpro.workers.dev/api/*` (автоматически)

### Переопределение API endpoint

Создайте файл `.env` в корне проекта:

```bash
VITE_API_BASE_URL=https://custom-domain.com
```

Теперь все запросы будут идти на: `https://custom-domain.com/api/*`

## Тестирование

### Проверка в браузере

1. Откройте DevTools → Network
2. Запустите `npm run dev`
3. Проверьте что запросы идут на `/api/*` (относительный путь)

### Проверка в мобильном приложении

1. Соберите приложение: `npm run android`
2. Откройте logcat в Android Studio
3. Проверьте что запросы идут на `https://planer.quicpro.workers.dev/api/*`

## Важные замечания

- Файл `.env` добавлен в `.gitignore` и не должен коммититься
- Домен `https://planer.quicpro.workers.dev` захардкоден в `apiClient.ts` для мобильной версии
- Для изменения домена нужно либо изменить код, либо использовать переменную окружения

### Разница между `server.url` в Capacitor и API endpoint

**Внимание:** В `capacitor.config.ts` также указан `server.url`, но это **разные вещи**:

- `server.url` в `capacitor.config.ts` — это адрес откуда загружаются **статические файлы приложения** (HTML, CSS, JS)
- `VITE_API_BASE_URL` / логика в `apiClient.ts` — это адрес куда отправляются **API запросы**

#### Для разработки:
```typescript
// capacitor.config.ts
server: {
  url: 'https://planer.quicpro.workers.dev', // Загрузка статики с сервера (живая перезагрузка)
}
```

#### Для продакшн сборки:
Рекомендуется **убрать** `server.url` из `capacitor.config.ts`:
```typescript
// capacitor.config.ts (production)
// Закомментируйте или удалите server.url для продакшн сборки
// server: {
//   url: 'https://planer.quicpro.workers.dev',
// },
```

Тогда статические файлы будут загружаться локально с устройства (быстрее и работает оффлайн), а API запросы все равно будут идти на сервер.

## Дополнительные ресурсы

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

