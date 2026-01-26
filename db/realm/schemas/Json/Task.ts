import Realm from "realm";

export type SyncStatus =
  | "pending_creation"
  | "pending_update"
  | "pending_delete"
  | "sync_error"
  | "synced";

export class JsonTask extends Realm.Object<JsonTask> {
  _id!: number;
  title!: string;
  description?: string;
  due_date?: string;
  is_completed!: boolean;
  priority!: string;
  created_at!: string;
  images?: string[];
  media_count?: number;
  comments_count?: number;

  // New Status Field
  sync_status!: SyncStatus;

  // Optional: field to store error messages if sync fails
  sync_error_details?: string;

  static schema: Realm.ObjectSchema = {
    name: "JsonTask",
    properties: {
      _id: "int",
      title: "string",
      is_completed: { type: "bool", default: false },
      priority: { type: "string", default: "low" },
      description: "string?",
      due_date: "string?",
      created_at: "string",
      images: { type: "list", objectType: "string", default: [] },
      media_count: "int?",
      comments_count: "int?",

      // Default to 'synced' so when we pull from cloud, they are clean.
      // We will override this when creating local items.
      sync_status: { type: "string", default: "synced" },
      sync_error_details: "string?",
    },
    primaryKey: "_id",
  };
}
