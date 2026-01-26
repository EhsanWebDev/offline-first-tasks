import { Priority } from "@/api/types/tasks";
import Realm from "realm";
import { v4 as uuidv4 } from "uuid";
import { JsonTask } from "../realm/schemas/Json/Task";
import { SyncStatus, Task } from "../realm/schemas/Task";

export type TaskType = {
  title: string;
  description: string;
  due_date: number;
  is_completed: boolean;
  priority: Priority;
  created_at: number;
};

// Helper to get realm instance (for use outside React components)
let realmInstance: Realm | null = null;

export const setRealmInstance = (realm: Realm) => {
  realmInstance = realm;
};

const getRealm = (): Realm => {
  if (!realmInstance) {
    throw new Error(
      "Realm instance not set. Use useRealm() hook in React components.",
    );
  }
  return realmInstance;
};

export const getTasks = (realm: Realm): Realm.Results<Task> => {
  return realm.objects<Task>("Task").sorted("created_at", true);
};

export const getTaskById = (realm: Realm, id: string): Task | null => {
  return (
    realm.objectForPrimaryKey<Task>("Task", id) ||
    realm.objects<Task>("Task").filtered("id == $0", id)[0] ||
    null
  );
};

export const createTask = async (
  realm: Realm,
  newTask: TaskType,
): Promise<Task> => {
  const now = new Date();
  const taskId = uuidv4();

  let createdTask: Task = undefined as unknown as Task;
  realm.write(() => {
    createdTask = realm.create<Task>("Task", {
      _id: new Realm.BSON.ObjectId(),
      id: taskId,
      title: newTask.title,
      description: newTask.description || undefined,
      due_date: newTask.due_date ? new Date(newTask.due_date) : undefined,
      is_completed: newTask.is_completed,
      priority: newTask.priority,
      created_at: newTask.created_at ? new Date(newTask.created_at) : now,
      updated_at: now,
      sync_status: SyncStatus.PENDING_CREATION,
      sync_error_message: undefined,
      serverId: undefined,
      comments: [],
      media: [],
      commentsCount: 0,
      mediaCount: 0,
    });
  });

  return createdTask;
};

/**
 * Updates a task and sets the appropriate sync_status.
 * If the task is pending_creation, it stays that way (still needs POST).
 * Otherwise, it becomes pending_update.
 */
export const updateTaskWithSyncStatus = async (
  realm: Realm,
  task: JsonTask,
  updates: Partial<
    Pick<
      JsonTask,
      "title" | "description" | "due_date" | "is_completed" | "priority"
    >
  >,
): Promise<void> => {
  realm.write(() => {
    // --- STATE MACHINE LOGIC ---

    // 1. Is this a retry of a failed item?
    if (task.sync_status === "sync_error") {
      // Recovery logic:
      // If ID is temp (-1), go back to creation queue.
      // If ID is real (50), go back to update queue.
      task.sync_status = task._id < 0 ? "pending_creation" : "pending_update";

      // Clear the error message since we are retrying
      task.sync_error_details = undefined;
    }

    // 2. Is this a standard update?
    // If it's ALREADY 'pending_creation', we leave it alone (it's still a draft).
    // If it's 'synced' or 'pending_update', we ensure it's marked 'pending_update'.
    else if (task.sync_status !== "pending_creation") {
      task.sync_status = "pending_update";
    }

    // --- APPLY DATA UPDATES ---

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) return; // Skip undefined updates

      // Handle specific date transformation logic
      if (key === "due_date") {
        task.due_date = value
          ? new Date(value as string).toISOString()
          : undefined;
      }
      // Handle all other fields directly
      else {
        // @ts-ignore: Dynamic assignment is safe here due to strict input types
        task[key] = value;
      }
    });
  });
};

export const deleteTask = async (
  realm: Realm,
  task: JsonTask,
): Promise<void> => {
  realm.write(() => {
    if (task.sync_status === "pending_creation") {
      // It never existed on server, just kill it.
      realm.delete(task);
    } else {
      // It exists on server, mark for deletion request.
      task.sync_status = "pending_delete";
    }
  });
};
