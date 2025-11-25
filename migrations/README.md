# D1 Database Migrations

This directory contains SQL migration files for the Cloudflare D1 database.

## Database Info
- **Database ID**: `b76a6cd6-0697-4e0f-a65a-62f0d1eea0db`
- **Binding Name**: `DB`
- **Database Name**: `planer-db`

## Migration Files

- `0001_initial_schema.sql` - Initial schema with app_version table
- `0002_tasks_schema.sql` - Complete tasks system (users, tasks, tags, recurrence, sharing, friends, history)

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

### Core Tables

**app_version** - Application version information
**users** - User accounts (synced from Firebase Auth)
**tasks** - Main tasks table with priorities and statuses
**tags** - User-specific tags for categorization
**task_tags** - Many-to-many relation between tasks and tags

### Recurrence System

**task_recurrence** - Rules for recurring tasks (daily, weekly, monthly, etc.)
**task_instances** - Generated instances of recurring tasks

### Collaboration

**shared_tasks** - Tasks shared between users with permissions
**user_friends** - Friend connections for easier sharing

### Audit

**task_history** - Complete audit log of all task changes

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

