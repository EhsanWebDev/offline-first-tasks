---
name: sync-screen-queue
overview: Add a Sync screen that lists locally queued Task creates/updates and lets the user push them to Supabase. Track per-task sync state with a persisted `sync_status` and error message, and improve the sync utility to submit changes based on that status.
todos:
  - id: wmdb-schema-sync-status
    content: Bump WatermelonDB schema version and add `updated_at`, `sync_status`, `sync_error_message` columns + migrations.
    status: completed
  - id: write-path-set-status
    content: Update local create/update flows to maintain `updated_at` and `sync_status` correctly.
    status: completed
  - id: sync-queue-utility
    content: Implement push-by-status sync utility that updates per-task status to `synced`/`sync_error`.
    status: completed
  - id: sync-screen-ui
    content: Add `/sync` screen to list queued tasks and a Push changes button; link it from the More tab.
    status: completed
isProject: false
---

## Goals

- Add a new **Sync Queue** screen that lists all locally changed Tasks that are **pending creation** or **pending update** (and any `sync_error` items).
- Persist a per-task **`sync_status`** so each task can be tracked individually across launches.
- Add a **Push changes** button that pushes tasks to Supabase **based on `sync_status`**, then updates each task’s status to `synced` or `sync_error`.

## Key design choices (from your answers)

- **Scope**: Tasks only.
- **Status storage**: store `sync_status` directly on each local Task record.

## Data model changes (WatermelonDB)

- Update tasks schema + model:
- Add `updated_at` (number, required) so we can correctly reason about “updated tasks”.
- Add `sync_status` (string, required) with values:
- `pending_creation`
- `pending_update`
- `sync_error`
- `synced`
- Add `sync_error_message` (string, optional) to display the backend error on the Sync screen.
- Bump WatermelonDB schema version and add migrations.

Files:

- Update schema in [`/Users/ehsanahmad/Desktop/Dev/react-native/expo/expo-new/expo-new-app/db/model/schema.js`](/Users/ehsanahmad/Desktop/Dev/react-native/expo/expo-new/expo-new-app/db/model/schema.js)
- Add migrations in [`/Users/ehsanahmad/Desktop/Dev/react-native/expo/expo-new/expo-new-app/db/model/migrations.js`](/Users/ehsanahmad/Desktop/Dev/react-native/expo/expo-new/expo-new-app/db/model/migrations.js)
- Update model fields in [`/Users/ehsanahmad/Desktop/Dev/react-native/expo/expo-new/expo-new-app/db/model/Task.js`](/Users/ehsanahmad/Desktop/Dev/react-native/expo/expo-new/expo-new-app/db/model/Task.js)

## Write-path changes (set status + timestamps)

- On local create:
- Set `created_at = now`, `updated_at = now`, `sync_status = pending_creation`.
- Clear `sync_error_message`.
- Likely needs setting a UUID client-side if Supabase expects uuid IDs (Watermelon auto-IDs may not be uuid).

- On local update:
- Always set `updated_at = now`.
- If current `sync_status` is `pending_creation`, keep it (still needs POST).
- Else set `sync_status = pending_update`.

Files:

- Update local create helper in [`/Users/ehsanahmad/Desktop/Dev/react-native/expo/expo-new/expo-new-app/db/queries/taskApi.ts`](/Users/ehsanahmad/Desktop/Dev/react-native/expo/expo-new/expo-new-app/db/queries/taskApi.ts)
- Update local update logic in [`/Users/ehsanahmad/Desktop/Dev/react-native/expo/expo-new/expo-new-app/app/edit-task/[id].tsx`](/Users/ehsanahmad/Desktop/Dev/react-native/expo/expo-new/expo-new-app/app/edit-task/[id].tsx) and in the home toggle path in [`/Users/ehsanahmad/Desktop/Dev/react-native/expo/expo-new/expo-new-app/app/(tabs)/index.tsx`](</Users/ehsanahmad/Desktop/Dev/react-native/expo/expo-new/expo-new-app/app/(tabs)/index.tsx>)

## Improved sync utility (push-by-status)

- Create a dedicated queue utility that:
- Queries WatermelonDB for tasks where `sync_status IN (pending_creation, pending_update, sync_error)`.
- For each task:
- `pending_creation`: call `supabase.from('tasks').insert(...)` (or `upsert` if we want idempotency).
- `pending_update`: call `supabase.from('tasks').update(...).eq('id', task.id)`.
- `sync_error`: treat as retry using the task’s latest desired operation (derived from current status or a conservative default: retry as update unless the record still doesn’t exist remotely).
- On success: set `sync_status = synced`, clear `sync_error_message`.
- On failure: set `sync_status = sync_error`, set `sync_error_message` to the thrown Supabase error.

Files:

- Add new module (recommended): [`/Users/ehsanahmad/Desktop/Dev/react-native/expo/expo-new/expo-new-app/utils/syncQueue.ts`](/Users/ehsanahmad/Desktop/Dev/react-native/expo/expo-new/expo-new-app/utils/syncQueue.ts)
- Optionally keep `mySync()` in [`/Users/ehsanahmad/Desktop/Dev/react-native/expo/expo-new/expo-new-app/utils/sync.ts`](/Users/ehsanahmad/Desktop/Dev/react-native/expo/expo-new/expo-new-app/utils/sync.ts) for “full sync”; the Sync screen’s button will call the new push-by-status function.

## Sync screen (UI)

- Add a new screen folder:
- `app/sync/index.tsx`
- `app/sync/styles.ts`
- Screen behavior:
- Observe tasks filtered by `sync_status != synced` (or specifically pending + error).
- Show a list item per task with:
- title
- operation label (Create/Update inferred from `sync_status`)
- status badge (pending_creation/pending_update/sync_error/synced)
- error message when `sync_error`
- Provide a primary CTA: **Push changes**
- Disabled when list is empty or while pushing.
- Shows progress + final toast.

Navigation entry point:

- Add a button/link in the More tab [`/Users/ehsanahmad/Desktop/Dev/react-native/expo/expo-new/expo-new-app/app/(tabs)/more.tsx`](</Users/ehsanahmad/Desktop/Dev/react-native/expo/expo-new/expo-new-app/app/(tabs)/more.tsx>) to open `/sync`.

## Notes / constraints

- WatermelonDB schema changes will require a rebuild of the dev client.
- If Supabase `tasks.id` is a UUID, we should ensure locally-created tasks use UUIDs (otherwise POST will fail and tasks will go to `sync_error`).

## Test plan

- Create a task offline → it appears in Sync Queue as `pending_creation`.
- Edit that task offline → it stays `pending_creation`.
- Push changes → it becomes `synced`.
- Edit an existing task offline → it appears as `pending_update`.
- Force a backend error (e.g. invalid value) → task shows `sync_error` with message; retry push after fixing.
