import Realm from "realm";
import { Task, SyncStatus } from "../db/realm/schemas/Task";
import { supabase } from "./supabase";

export type SyncResult = {
  success: number;
  failed: number;
  errors: { taskId: string; title: string; error: string }[];
};

/**
 * Get all tasks that need to be synced (pending_creation, pending_update, or sync_error)
 */
export const getPendingTasks = (realm: Realm): Realm.Results<Task> => {
  return realm
    .objects<Task>("Task")
    .filtered(
      "sync_status == $0 OR sync_status == $1 OR sync_status == $2",
      SyncStatus.PENDING_CREATION,
      SyncStatus.PENDING_UPDATE,
      SyncStatus.SYNC_ERROR
    );
};

/**
 * Mark a task as synced successfully and store the serverId
 */
const markTaskAsSynced = (realm: Realm, task: Task, serverId?: string): void => {
  realm.write(() => {
    task.sync_status = SyncStatus.SYNCED;
    task.sync_error_message = undefined;
    if (serverId !== undefined) {
      task.serverId = serverId;
    }
  });
};

/**
 * Mark a task as having a sync error
 */
const markTaskAsSyncError = (realm: Realm, task: Task, errorMessage: string): void => {
  realm.write(() => {
    task.sync_status = SyncStatus.SYNC_ERROR;
    task.sync_error_message = errorMessage;
  });
};

/**
 * Convert a local Task to the format expected by Supabase
 */
const taskToSupabaseFormat = (task: Task) => {
  return {
    title: task.title,
    description: task.description || null,
    due_date: task.due_date ? task.due_date.toISOString() : null,
    is_completed: task.is_completed,
    priority: task.priority,
    created_at: task.created_at.toISOString(),
    updated_at: task.updated_at.toISOString(),
  };
};

/**
 * Push a single task to Supabase based on its sync_status
 * - For new tasks (pending_creation): INSERT and get back the server ID
 * - For existing tasks (pending_update): UPDATE using the serverId
 */
const pushSingleTask = async (
  realm: Realm,
  task: Task
): Promise<{ success: boolean; error?: string; serverId?: string }> => {
  try {
    if (task.sync_status === SyncStatus.PENDING_CREATION) {
      // New task - INSERT (let Supabase generate the UUID)
      const insertData = taskToSupabaseFormat(task);
      const { data, error } = await supabase
        .from("tasks")
        .insert(insertData)
        .select("id")
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Return the server-generated UUID
      return { success: true, serverId: data?.id };
    } else if (
      task.sync_status === SyncStatus.PENDING_UPDATE ||
      task.sync_status === SyncStatus.SYNC_ERROR
    ) {
      // Existing task - UPDATE using serverId
      if (!task.serverId) {
        // If no serverId, this task was never synced - treat as creation
        const insertData = taskToSupabaseFormat(task);
        const { data, error } = await supabase
          .from("tasks")
          .insert(insertData)
          .select("id")
          .single();

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true, serverId: data?.id };
      }

      // Update using the serverId
      const updateData = taskToSupabaseFormat(task);
      const { error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", task.serverId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, serverId: task.serverId };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    return { success: false, error: errorMessage };
  }
};

/**
 * Push all pending changes to backend.
 * Returns a summary of the sync operation.
 */
export const pushPendingChanges = async (
  realm: Realm,
  onProgress?: (current: number, total: number) => void
): Promise<SyncResult> => {
  const pendingTasks = getPendingTasks(realm);
  const result: SyncResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  if (pendingTasks.length === 0) {
    return result;
  }

  const tasksArray = Array.from(pendingTasks);
  for (let i = 0; i < tasksArray.length; i++) {
    const task = tasksArray[i];

    // Report progress
    onProgress?.(i + 1, tasksArray.length);

    const { success, error, serverId } = await pushSingleTask(realm, task);

    if (success) {
      markTaskAsSynced(realm, task, serverId);
      result.success++;
    } else {
      markTaskAsSyncError(realm, task, error || "Unknown error");
      result.failed++;
      result.errors.push({
        taskId: task.id.toString(), // Ensure it's a string
        title: task.title,
        error: error || "Unknown error",
      });
    }
  }

  return result;
};

/**
 * Push a single specific task (useful for retry from UI)
 */
export const pushSingleTaskById = async (
  realm: Realm,
  taskId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Find task by id field (string UUID), not by _id (ObjectId primary key)
    const tasks = realm.objects<Task>("Task").filtered("id == $0", taskId);
    const task = tasks.length > 0 ? tasks[0] : null;

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const { success, error, serverId } = await pushSingleTask(realm, task);

    if (success) {
      markTaskAsSynced(realm, task, serverId);
    } else {
      markTaskAsSyncError(realm, task, error || "Unknown error");
    }

    return { success, error };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    return { success: false, error: errorMessage };
  }
};

/**
 * Get count of pending tasks by status
 */
export const getPendingTasksCounts = (realm: Realm): {
  pendingCreation: number;
  pendingUpdate: number;
  syncError: number;
  total: number;
} => {
  const pendingCreation = realm
    .objects<Task>("Task")
    .filtered("sync_status == $0", SyncStatus.PENDING_CREATION).length;
  const pendingUpdate = realm
    .objects<Task>("Task")
    .filtered("sync_status == $0", SyncStatus.PENDING_UPDATE).length;
  const syncError = realm
    .objects<Task>("Task")
    .filtered("sync_status == $0", SyncStatus.SYNC_ERROR).length;

  return {
    pendingCreation,
    pendingUpdate,
    syncError,
    total: pendingCreation + pendingUpdate + syncError,
  };
};
