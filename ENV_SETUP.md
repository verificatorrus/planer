# Настройка переменных окружения

## Создание .env файла

Создайте файл `.env` в корне проекта со следующим содержимым:

```bash
# API Configuration
# Leave empty for web builds (will use relative paths: /api)
# Set to full domain for custom deployments or testing
# Example: VITE_API_BASE_URL=https://planer.quicpro.workers.dev
VITE_API_BASE_URL=
```

## Как это работает

### Веб-версия (браузер)

Когда приложение запускается в браузере, API клиент использует **относительный путь** `/api`.

Это означает, что запросы будут отправляться на тот же домен, с которого загружено приложение:
- Локально: `http://localhost:5173/api`
- На продакшене: `https://planer.quicpro.workers.dev/api`

### Мобильное приложение (Capacitor)

Когда приложение запускается на **Android или iOS**, автоматически используется полный домен:

```
https://planer.quicpro.workers.dev/api
```

Это необходимо потому, что мобильное приложение использует протокол `file://` для загрузки локальных файлов, и относительные пути не будут работать для API запросов.

### Переопределение через переменную окружения

Если вы хотите использовать другой API endpoint (например, для тестирования или разработки), просто установите переменную `VITE_API_BASE_URL`:

```bash
VITE_API_BASE_URL=https://my-custom-domain.com
```

Тогда для всех платформ будет использоваться `https://my-custom-domain.com/api`.

## Технические детали

Логика определения API base URL находится в файле `src/services/apiClient.ts`:

```typescript
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

Функция `Capacitor.isNativePlatform()` возвращает `true` только когда приложение работает на реальном устройстве или эмуляторе (Android/iOS).


