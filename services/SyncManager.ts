import { JsonTask } from "@/db/realm/schemas/Json/Task";
import { RemoteTaskService } from "@/services/RemoteTask";
import { supabase } from "@/utils/supabase"; // Update path as needed
import Realm from "realm";

export interface SyncResult {
  total: number;
  success: number;
  failures: { id: number; reason: string }[];
}

const TABLE_NAME = "tasks_json";
const LOCAL_TABLE_NAME = "JsonTask";

export const SyncManager = {
  /**
   * PUSH: Uploads local changes (Creates, Updates, Deletes) to Cloud
   * Replaces the old 'syncPendingTasks'
   */
  async processSyncQueue(
    realm: Realm,
    onProgress?: (current: number, total: number) => void,
  ): Promise<SyncResult> {
    // 1. Get all items that are NOT synced
    const pendingItems = realm
      .objects<JsonTask>(LOCAL_TABLE_NAME)
      .filtered("sync_status != 'synced'");

    const total = pendingItems.length;
    const result: SyncResult = { total, success: 0, failures: [] };

    if (total === 0) return result;

    // Convert to array to safely iterate without collection modification errors
    const itemsToSync = Array.from(pendingItems);

    for (let i = 0; i < total; i++) {
      const task = itemsToSync[i];

      // Update UI
      if (onProgress) onProgress(i + 1, total);

      try {
        switch (task.sync_status) {
          case "pending_creation":
            await this.handleCreate(realm, task);
            break;
          case "pending_update":
            await this.handleUpdate(realm, task);
            break;
          case "pending_delete":
            await this.handleDelete(realm, task);
            break;
        }
        result.success++;
      } catch (error: any) {
        console.error(`Sync error on ID ${task._id}:`, error);

        result.failures.push({ id: task._id, reason: error.message });

        realm.write(() => {
          if (task.isValid()) {
            task.sync_status = "sync_error";
            task.sync_error_details = error.message;
          }
        });
      }
    }

    return result;
  },

  /**
   * PULL: Downloads latest data from Supabase and updates Realm
   */
  async pullFromCloud(realm: Realm) {
    console.log("Sync: Starting Pull...");

    try {
      const remoteTasks = await RemoteTaskService.fetchAllTasks();

      if (remoteTasks.length === 0) return;

      realm.write(() => {
        remoteTasks.forEach((taskData) => {
          realm.create(
            "JsonTask",
            {
              _id: taskData._id,
              title: taskData.title,
              description: taskData.description,
              is_completed: taskData.is_completed,
              priority: taskData.priority,
              created_at: taskData.created_at,
              images: taskData.images,

              // IMPORTANT: Force status to synced when coming from cloud
              sync_status: "synced",
              sync_error_details: null,
            },
            Realm.UpdateMode.Modified,
          );
        });
      });

      console.log(`Sync: Pulled ${remoteTasks.length} items.`);
    } catch (error) {
      console.error("Pull Failed:", error);
      throw error;
    }
  },

  // --- HELPERS ---

  async handleCreate(realm: Realm, task: JsonTask) {
    const tempId = task._id;
    // Explicitly pick fields. Do NOT use {...task}
    const payload = {
      title: task.title,
      is_completed: task.is_completed,
      priority: task.priority,
      created_at: task.created_at,
      description: task.description,
      due_date: task.due_date,
    };

    const { data, error } = await supabase
      .from(TABLE_NAME) // Make sure this matches your supabase table name
      .insert({ json: payload })
      .select("id")
      .single();

    if (error) throw error;

    realm.write(() => {
      realm.create(
        "JsonTask",
        {
          ...payload,
          _id: data.id, // Swap Temp ID for Real ID
          sync_status: "synced",
          sync_error_details: undefined,
        },
        Realm.UpdateMode.Modified,
      );

      const oldObj = realm.objectForPrimaryKey("JsonTask", tempId);
      if (oldObj) realm.delete(oldObj);
    });
  },

  async handleUpdate(realm: Realm, task: JsonTask) {
    // Explicitly pick fields to avoid circular dependencies
    const payload = {
      title: task.title,
      is_completed: task.is_completed,
      priority: task.priority,
      created_at: task.created_at,
      description: task.description,
      due_date: task.due_date,
    };

    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ json: payload })
      .eq("id", task._id);

    if (error) throw error;

    realm.write(() => {
      task.sync_status = "synced";
      task.sync_error_details = undefined;
    });
  },

  async handleDelete(realm: Realm, task: JsonTask) {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq("id", task._id);

    if (error) throw error;

    realm.write(() => {
      realm.delete(task);
    });
  },
};
