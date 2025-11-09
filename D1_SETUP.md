# D1 Database Setup - Complete ✅

## Что было сделано

1. ✅ Подключена база данных D1 к проекту
2. ✅ Создана миграция с таблицей `app_version`
3. ✅ Миграция успешно применена к удаленной базе данных
4. ✅ Созданы API endpoints для работы с версиями
5. ✅ Добавлена типизация TypeScript

## Конфигурация

### Database Info
- **Database ID**: `b76a6cd6-0697-4e0f-a65a-62f0d1eea0db`
- **Database Name**: `planer-db`
- **Binding**: `DB`
- **Account ID**: `2d1a483aecfd8366465767348fc374a3`

### Binding в wrangler.jsonc
```json
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "planer-db",
    "database_id": "b76a6cd6-0697-4e0f-a65a-62f0d1eea0db"
  }
]
```

## API Endpoints

### 1. Получить текущую версию приложения
```
GET /api/version
```

Возвращает текущую активную версию (где `is_current = 1`).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "version": "1.0.0",
    "build_number": 1,
    "platform": "web",
    "release_date": "2025-11-09T...",
    "notes": "Initial release",
    "is_current": 1,
    "created_at": "2025-11-09T...",
    "updated_at": "2025-11-09T..."
  }
}
```

### 2. Получить все версии
```
GET /api/versions
```

Возвращает все версии из базы данных, отсортированные по дате создания (новые первыми).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "version": "1.0.0",
      "build_number": 1,
      "platform": "web",
      "release_date": "2025-11-09T...",
      "notes": "Initial release",
      "is_current": 1,
      "created_at": "2025-11-09T...",
      "updated_at": "2025-11-09T..."
    }
  ]
}
```

## Тестирование

### Локальная разработка
```bash
# Запустить локальный dev сервер
npm run dev
```

### Тестирование API
После запуска сервера, откройте в браузере:
- `http://localhost:5173/api/version` - текущая версия
- `http://localhost:5173/api/versions` - все версии

### Работа с базой данных

**Выполнить SQL запрос:**
```bash
npx wrangler d1 execute planer-db --command="SELECT * FROM app_version" --remote
```

**Добавить новую версию:**
```bash
npx wrangler d1 execute planer-db --remote --command="
INSERT INTO app_version (version, build_number, platform, notes, is_current) 
VALUES ('1.1.0', 2, 'web', 'Bug fixes and improvements', 0)
"
```

**Сделать версию текущей:**
```bash
# Сначала снять флаг со всех версий
npx wrangler d1 execute planer-db --remote --command="UPDATE app_version SET is_current = 0"

# Затем установить флаг для нужной версии
npx wrangler d1 execute planer-db --remote --command="UPDATE app_version SET is_current = 1 WHERE id = 2"
```

## Структура файлов

```
/planer
├── wrangler.jsonc              # Конфигурация Cloudflare Workers с D1
├── worker/
│   ├── index.ts                # Worker с API endpoints
│   └── db-types.ts             # TypeScript типы для БД
├── migrations/
│   ├── README.md               # Документация по миграциям
│   └── 0001_initial_schema.sql # Начальная миграция
└── worker-configuration.d.ts   # Сгенерированные типы (включая DB binding)
```

## Следующие шаги

1. Развернуть приложение: `npm run deploy`
2. Создать дополнительные миграции при необходимости
3. Добавить API для создания/обновления версий
4. Интегрировать с фронтендом для отображения версии

## Полезные команды

```bash
# Применить новую миграцию
npx wrangler d1 execute planer-db --file=migrations/XXXX_name.sql --remote

# Обновить TypeScript типы после изменения wrangler.jsonc
npx wrangler types

# Посмотреть информацию о БД
npx wrangler d1 info planer-db

# Список всех таблиц
npx wrangler d1 execute planer-db --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
```

