import { Priority } from "@/api/types/tasks";
import dayjs from "dayjs";
import Realm from "realm";
import {
  JsonBlobTask,
  TaskCommentPayload,
  TaskMediaPayload,
  TaskPayload,
} from "../realm/schemas/Json/JsonTask";
import { Task } from "../realm/schemas/Task";

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

export const createTask = (
  realm: Realm,
  formData: Omit<
    TaskPayload,
    "created_at" | "comments" | "media" | "_id" | "sync_status"
  >, // Omit auto-fields
): JsonBlobTask => {
  // 1. Generate Temporal ID (Negative Integer)
  // This ensures no collision with Supabase IDs (which are positive)
  const tempId = -Date.now();

  // 2. Prepare the full payload
  const fullPayload: TaskPayload = {
    _id: tempId,
    sync_status: "pending_creation",

    // Convert Dates to Strings for JSON storage
    created_at: dayjs().format(),
    due_date: formData.due_date ? dayjs(formData.due_date).format() : undefined,

    // Initialize Defaults
    images: [],
    // Add any other specific fields for your blob here

    ...formData,
  };

  let newTask: JsonBlobTask;

  // 3. Write to Realm (Synchronous)
  realm.write(() => {
    newTask = realm.create<JsonBlobTask>("JsonBlobTask", {
      _id: tempId,

      // THE IMPORTANT PART: Pack everything into the string
      json_blob: JSON.stringify(fullPayload),

      sync_status: "pending_creation",
      sync_error_details: undefined,
    });
  });

  // @ts-ignore - newTask is assigned inside write block
  return newTask;
};
export const addCommentToTask = (
  realm: Realm,
  task: JsonBlobTask,
  comment: TaskCommentPayload,
): void => {
  realm.write(() => {
    const rawPayload = task.parsed;
    const updatedComments = [...(rawPayload.comments || []), comment];
    task.json_blob = JSON.stringify({
      ...rawPayload,
      comments: updatedComments,
    });
    task.sync_status = "pending_update";
  });
};
export const addTaskMediaToTask = (
  realm: Realm,
  task: JsonBlobTask,
  media: TaskMediaPayload,
): void => {
  realm.write(() => {
    const rawPayload = task.parsed;
    const updatedMedia = [...(rawPayload.media || []), media];
    task.json_blob = JSON.stringify({
      ...rawPayload,
      media: updatedMedia,
    });
    task.sync_status = "pending_update";
  });
};
export const deleteTaskMediaFromTask = (
  realm: Realm,
  task: JsonBlobTask,
  mediaId: number,
): void => {
  realm.write(() => {
    const rawPayload = task.parsed;
    const updatedMedia = rawPayload.media?.filter((m) => m._id !== mediaId);
    if (updatedMedia) {
      task.json_blob = JSON.stringify({
        ...rawPayload,
        media: updatedMedia,
      });
      task.sync_status = "pending_update";
    }
  });
};
export const deleteCommentFromTask = (
  realm: Realm,
  task: JsonBlobTask,
  commentId: number,
): void => {
  realm.write(() => {
    const rawPayload = task.parsed;
    const updatedComments = rawPayload.comments?.filter(
      (c) => c._id !== commentId,
    );
    task.json_blob = JSON.stringify({
      ...rawPayload,
      comments: updatedComments,
    });
    task.sync_status = "pending_update";
  });
};
export const updateTaskWithSyncStatus = (
  realm: Realm,
  task: JsonBlobTask, // Input must be the Realm Object, not the raw interface
  updates: Partial<TaskPayload>,
): void => {
  // realm.write is synchronous, so we remove async/Promise

  realm.write(() => {
    // --- 1. STATE MACHINE LOGIC ---

    // Recovery: If it was an error, reset status based on ID type (Temp vs Real)
    if (task.sync_status === "sync_error") {
      task.sync_status = task._id < 0 ? "pending_creation" : "pending_update";
      task.sync_error_details = undefined;
    }
    // Standard Update: If currently 'synced', move to 'pending_update'.
    // If 'pending_creation', keep it there (it hasn't left the device yet).
    else if (task.sync_status !== "pending_creation") {
      task.sync_status = "pending_update";
    }

    // --- 2. DATA UPDATE LOGIC (The Blob Strategy) ---

    // A. Unpack: Parse existing data from the blob
    let currentPayload: TaskPayload;
    try {
      currentPayload = JSON.parse(task.json_blob);
    } catch (e) {
      console.error("Critical: Failed to parse task blob for update", e);
      return; // Abort if data is corrupted
    }

    // B. Modify: Apply updates to the plain JavaScript object
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) return;

      if (key === "due_date") {
        currentPayload.due_date = value
          ? new Date(value as string).toISOString()
          : undefined;
      } else {
        // @ts-ignore: Key is guaranteed valid by Partial<TaskPayload>
        currentPayload[key] = value;
      }
    });

    // C. Repack: Stringify and save back to Realm
    task.json_blob = JSON.stringify(currentPayload);
  });
};
export const deleteTask = (
  realm: Realm,
  task: JsonBlobTask, // Ensure this uses your JsonTask class
): void => {
  realm.write(() => {
    if (task.sync_status === "pending_creation") {
      // Case 1: Local draft (never sent to server) -> Kill it.
      realm.delete(task);
    } else {
      // Case 2: Exists on server -> Mark for Soft Delete.
      task.sync_status = "pending_delete";
    }
  });
};
