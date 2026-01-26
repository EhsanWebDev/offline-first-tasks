import { Realm } from "realm";
import { TaskCommentEmbedded } from "./TaskCommentEmbedded";
import { TaskMediaEmbedded } from "./TaskMediaEmbedded";

// Sync status constants (matching WatermelonDB semantics)
export const SyncStatus = {
  PENDING_CREATION: "pending_creation",
  PENDING_UPDATE: "pending_update",
  SYNC_ERROR: "sync_error",
  SYNCED: "synced",
} as const;

export type SyncStatusType = typeof SyncStatus[keyof typeof SyncStatus];

export class Task extends Realm.Object<Task> {
  _id!: Realm.BSON.ObjectId;
  id!: string; // Client-generated UUID or server ID
  title!: string;
  description?: string;
  due_date?: Date;
  is_completed!: boolean;
  priority!: "low" | "medium" | "high";
  created_at!: Date;
  updated_at!: Date;
  sync_status!: SyncStatusType;
  sync_error_message?: string;
  serverId?: string; // DynamoDB ID (replaces server_id number)
  comments!: TaskCommentEmbedded[];
  media!: TaskMediaEmbedded[];
  // Denormalized counts for faster list rendering
  commentsCount?: number;
  mediaCount?: number;

  static schema: Realm.ObjectSchema = {
    name: "Task",
    primaryKey: "_id",
    properties: {
      _id: "objectId",
      id: { type: "string", indexed: true },
      title: "string",
      description: "string?",
      due_date: "date?",
      is_completed: { type: "bool", default: false },
      priority: { type: "string", default: "medium" },
      created_at: "date",
      updated_at: "date",
      sync_status: { type: "string", default: "pending_creation" },
      sync_error_message: "string?",
      serverId: "string?",
      comments: { type: "list", objectType: "TaskCommentEmbedded", default: [] },
      media: { type: "list", objectType: "TaskMediaEmbedded", default: [] },
      commentsCount: "int?",
      mediaCount: "int?",
    },
  };
}
