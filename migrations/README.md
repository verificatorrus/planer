# D1 Database Migrations

This directory contains SQL migration files for the Cloudflare D1 database.

## Database Info
- **Database ID**: `b76a6cd6-0697-4e0f-a65a-62f0d1eea0db`
- **Binding Name**: `DB`
- **Database Name**: `planer-db`

## Migration Files

- `0001_initial_schema.sql` - Initial schema with app_version table

## How to Run Migrations

### Apply migration to remote (production) database:
```bash
npx wrangler d1 execute planer-db --file=migrations/XXXX_migration_name.sql --remote
```

### Apply migration to local development database:
```bash
npx wrangler d1 execute planer-db --file=migrations/XXXX_migration_name.sql --local
```

## How to Create New Migration

1. Create a new SQL file with naming pattern: `XXXX_description.sql` (where XXXX is incremental number)
2. Write your SQL commands
3. Apply the migration using commands above

## Database Schema

### app_version
Stores application version information for different platforms.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| version | TEXT | Version string (e.g., "1.0.0") |
| build_number | INTEGER | Build number |
| platform | TEXT | Platform: 'web', 'android', 'ios' |
| release_date | DATETIME | Release date |
| notes | TEXT | Release notes |
| is_current | INTEGER | Current version flag (0 or 1) |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Update timestamp |

## Useful Commands

### Query the database:
```bash
npx wrangler d1 execute planer-db --command="SELECT * FROM app_version" --remote
```

### List all tables:
```bash
npx wrangler d1 execute planer-db --command="SELECT name FROM sqlite_master WHERE type='table'" --remote
```

### Get database info:
```bash
npx wrangler d1 info planer-db
```

