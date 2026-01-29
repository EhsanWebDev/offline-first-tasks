import Realm from "realm";

export type SyncStatus =
  | "pending_creation"
  | "pending_update"
  | "pending_delete"
  | "sync_error"
  | "synced";

export interface TaskCommentPayload {
  _id: number;
  content: string;
  created_at: Date | string;
  task_id: number;
}
export interface TaskMediaPayload {
  _id: number;
  url: string;
  type: "image" | "video" | "file";
  created_at: string;
  task_id: number;
}
// Define the shape of your inner JSON data for TypeScript safety
export interface TaskPayload {
  _id: number;
  title: string;
  description?: string;
  is_completed: boolean;
  priority: "low" | "medium" | "high";
  due_date?: string;
  created_at: string;
  media?: TaskMediaPayload[];
  comments?: TaskCommentPayload[];
  sync_status: SyncStatus;
  sync_error_details?: string;
}

export class JsonBlobTask extends Realm.Object<JsonBlobTask> {
  _id!: number;

  // The giant stringified blob
  json_blob!: string;

  sync_status!: SyncStatus;
  sync_error_details?: string;

  // --- HELPER ---
  // This allows you to do `task.parsed.title` in your UI
  get parsed(): TaskPayload {
    try {
      return JSON.parse(this.json_blob);
    } catch (e) {
      return {} as TaskPayload;
    }
  }

  static schema: Realm.ObjectSchema = {
    name: "JsonBlobTask",
    properties: {
      _id: "int",
      json_blob: "string", // Stores the JSON.stringified data
      sync_status: { type: "string", default: "synced" },
      sync_error_details: "string?",
    },
    primaryKey: "_id",
  };
}
