# Offline-First Architecture Guide: Expo + RealmDB + DynamoDB Backend

## 1. Core Philosophy
This project uses **RealmDB** as the source of truth for the UI. The app reads **only** from the local database. A background synchronization process keeps the local database consistent with the **DynamoDB** remote backend.

## 2. Tech Stack
* **Frontend:** React Native (Expo)
* **Local DB:** RealmDB (NoSQL embedded database)
* **Remote DB:** DynamoDB (NoSQL)
* **Sync:** Custom push/pull sync engine

## 3. Database Schema Requirements

### RealmDB (Local)
Every object must have:
* `_id` (ObjectId): Primary key (Realm internal).
* `id` (string): Client-generated UUID or server ID (indexed).
* `created_at` (Date): Timestamp.
* `updated_at` (Date): Timestamp (Critical for sync).
* `sync_status` (string): One of `pending_creation`, `pending_update`, `sync_error`, `synced`.
* `sync_error_message` (string, optional): Error message if sync failed.
* `serverId` (string, optional): Backend-assigned ID after first sync.

### DynamoDB (Remote)
Every item should have:
* `id` (string): Primary Key.
* `updatedAt` (ISO string): **Required** for delta sync logic.
* `deletedAt` (ISO string, optional): Recommended for "Soft Deletes" so other devices know what to remove.
* Embedded arrays: `comments[]`, `media[]` (document-style, matching Realm structure).

## 4. Synchronization Protocol

We use the "Delta Sync" pattern with a push-then-pull strategy.

### The "Push" (Local -> Remote)
1. **Realm** queries all tasks with `sync_status` in `[pending_creation, pending_update, sync_error]`.
2. **Sync Function** iterates through pending tasks and calls backend API:
   * `pending_creation` -> `POST /tasks`
   * `pending_update` -> `PUT /tasks/:id`
3. On success: mark task as `synced` and store `serverId`.
4. On failure: mark as `sync_error` and store error message.

### The "Pull" (Remote -> Local)
1. **Frontend** sends the timestamp of the last successful sync (`lastSyncedAt`).
2. **Backend** returns only records where `updatedAt > lastSyncedAt` (via GSI query).
3. **Realm** upserts tasks (creates if not exists, updates if exists) based on `id` or `serverId`.
4. Update `lastSyncedAt` in `SyncState` singleton object.

## 5. Implementation Details

### Realm Schema Structure
- **Task**: Main object with embedded arrays for comments and media
- **TaskCommentEmbedded**: Embedded object (not a separate table)
- **TaskMediaEmbedded**: Embedded object (not a separate table)
- **SyncState**: Singleton object storing `lastSyncedAt`

### Using Realm in Components
```typescript
import { useQuery, useRealm } from "@realm/react";
import { Task } from "@/db/realm/schemas/Task";

// Get all tasks (live query - auto-updates)
const tasks = useQuery<Task>("Task", (tasks) => {
  return tasks.sorted("created_at", true);
});

// Get realm instance for writes
const realm = useRealm();

// Write to Realm (must be in write transaction)
realm.write(() => {
  task.title = "New title";
  task.updated_at = new Date();
  task.sync_status = "pending_update";
});
```

### Sync Status Flow
1. **Create**: `sync_status = "pending_creation"` → Push to backend → `sync_status = "synced"`, store `serverId`
2. **Update**: If `sync_status !== "pending_creation"`, set to `"pending_update"` → Push → `"synced"`
3. **Error**: On push failure → `sync_status = "sync_error"`, store error message
4. **Retry**: User can retry from sync queue screen

## 6. Critical Rules
* **Always** use `realm.write()` for any modifications to Realm objects.
* **Never** update `updated_at` manually on the client if possible; let the backend handle it, OR ensure client time is reliable.
* **Always** set `sync_status` appropriately when creating/updating tasks locally.
* **Never** read directly from backend API in UI components - always read from Realm.
* Use `useQuery` hook for reactive queries that auto-update when data changes.

## 7. Backend API Requirements

The backend must provide:
- `POST /tasks` - Create new task (returns task with server-generated `id`)
- `PUT /tasks/:id` - Update existing task
- `DELETE /tasks/:id` - Delete task (or soft delete)
- `GET /tasks?updatedSince=ISO_DATE` - Fetch tasks updated since timestamp
- `GET /tasks` - Fetch all tasks (for initial sync)

All endpoints should accept/return tasks with embedded `comments[]` and `media[]` arrays matching the Realm schema structure.

## 8. Migration Notes

When migrating from WatermelonDB to Realm:
- Local data is wiped (no migration path)
- All tasks will be re-synced from backend on first sync
- Ensure backend has all existing data before switching
