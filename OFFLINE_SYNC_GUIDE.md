# Offline-First Architecture Guide: Expo + WatermelonDB + Supabase

## 1. Core Philosophy
This project uses **WatermelonDB** as the source of truth for the UI. The app reads **only** from the local database. A background synchronization process keeps the local database consistent with the **Supabase** remote backend.

## 2. Tech Stack
* **Frontend:** React Native (Expo)
* **Local DB:** WatermelonDB (SQLite)
* **Remote DB:** Supabase (PostgreSQL)
* **Auth:** Supabase Auth

## 3. Database Schema Requirements

### WatermelonDB (Local)
Every table must have:
* `id` (string): Primary key (matches Supabase UUID).
* `created_at` (number): Timestamp.
* `updated_at` (number): Timestamp (Critical for sync).
* `_status` / `_changed`: Managed internally by WatermelonDB.

### Supabase (Remote)
Every table must have:
* `id` (uuid): Primary Key.
* `updated_at` (timestamptz): **Required** for delta sync logic.
* `deleted_at` (timestamptz, nullable): Recommended for "Soft Deletes" so other devices know what to remove.

## 4. Synchronization Protocol

We use the "Delta Sync" pattern.

### The "Pull" (Remote -> Local)
1.  **Frontend** sends the timestamp of the last successful sync (`lastPulledAt`).
2.  **Backend** (Supabase Query) returns only records where `updated_at > lastPulledAt`.
3.  **WatermelonDB** automatically inserts new records and updates existing ones based on ID.

### The "Push" (Local -> Remote)
1.  **WatermelonDB** tracks changes in a `_changes` table.
2.  **Sync Function** grabs all local `created`, `updated`, and `deleted` records.
3.  **Frontend** iterates through these lists and fires Supabase calls:
    * `created` -> `supabase.insert()`
    * `updated` -> `supabase.update()`
    * `deleted` -> `supabase.delete()` (or update `deleted_at`)

## 5. Implementation Steps for Agent

1.  **Install Watermelon:**
    ```bash
    npm install @nozbe/watermelondb
    npm install --save-dev @babel/plugin-proposal-decorators
    ```

2.  **Configure Babel:**
    Add `["@babel/plugin-proposal-decorators", { "legacy": true }]` to `babel.config.js`.

3.  **Define Schema (`db/schema.ts`):**
    Ensure all tables include an `updated_at` column.

4.  **Create Models (`db/Task.ts`):**
    Add the `@date('updated_at') updatedAt` decorator to models.

5.  **Write Sync Logic (`utils/sync.ts`):**
    Implement the `synchronize()` function connecting to Supabase.

6.  **Wrap UI:**
    Use `withObservables` for all read operations. Never read from Supabase directly in UI components.

## 6. Critical Rules
* **Never** use `set(...)` directly on objects. Always use `database.write()`.
* **Never** update `updated_at` manually on the client if possible; let the backend handle it, OR ensure client time is reliable.
* **Always** re-build the dev client (`npx expo run:android`) after changing schemas.