import { JsonBlobTask } from "@/db/realm/schemas/Json/JsonTask";
import { RemoteTaskService } from "@/services/RemoteTask";
import { supabase } from "@/utils/supabase"; // Update path as needed
import Realm from "realm";

export interface SyncResult {
  total: number;
  success: number;
  failures: { id: number; reason: string }[];
}

const REMOTE_TABLE_NAME = "tasks_json";
const LOCAL_TABLE_NAME = "JsonBlobTask";

export interface SyncResult {
  total: number;
  success: number;
  failures: Array<{ id: number; reason: string }>;
}

export const SyncManager = {
  /**
   * PUSH: Uploads local changes (Creates, Updates, Deletes) to Cloud
   */
  async processSyncQueue(
    realm: Realm,
    onProgress?: (current: number, total: number) => void,
  ): Promise<SyncResult> {
    // 1. Get all items that are NOT synced
    const pendingItems = realm
      .objects<JsonBlobTask>(LOCAL_TABLE_NAME)
      .filtered("sync_status != 'synced'");

    const total = pendingItems.length;
    const result: SyncResult = { total, success: 0, failures: [] };

    if (total === 0) return result;

    // Convert to array to safely iterate
    const itemsToSync = Array.from(pendingItems);

    for (let i = 0; i < total; i++) {
      const task = itemsToSync[i];

      // Update UI Progress
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
   * Stores data as a STRINGIFIED BLOB
   */
  async pullFromCloud(realm: Realm) {
    console.log("Sync: Starting Pull...");

    try {
      // 1. Fetch raw data from Supabase (RemoteTaskService should return { id, json })
      const remoteTasks = await RemoteTaskService.fetchAllTasks();

      if (remoteTasks.length === 0) return;

      realm.write(() => {
        remoteTasks.forEach((row: any) => {
          // We expect row to have { _id, ...restOfJson } from your RemoteTaskService
          // Or if it returns raw supabase rows: { id: 123, json: {...} }

          // Let's assume RemoteTaskService returns the "Flattened" object.
          // We need to repack it into a blob for Realm.

          // Extract ID, pack the rest
          const { _id, ...payload } = row;

          // THE CHANGE: Pack into json_blob string
          const blobString = JSON.stringify(payload);

          realm.create(
            LOCAL_TABLE_NAME,
            {
              _id,
              json_blob: blobString,
              sync_status: "synced",
              sync_error_details: null,
            },
            Realm.UpdateMode.Modified,
          );
        });
      });

      console.log(`Sync: Pulled ${remoteTasks.length} items. `);
      console.log(
        `Sync items ids: ${remoteTasks.map((task) => JSON.stringify(task))}`,
      );
    } catch (error) {
      console.error("Pull Failed:", error);
      throw error;
    }
  },

  // --- HELPERS ---

  async handleCreate(realm: Realm, task: JsonBlobTask) {
    const tempId = task._id;

    // 1. UNPACK: Parse the blob to get the real JSON payload for Supabase
    const rawPayload = task.parsed;
    const { _id, ...cleanPayload } = rawPayload;

    // 2. SEND: Insert into Supabase
    const { data, error } = await supabase
      .from(REMOTE_TABLE_NAME)
      .insert({ json: cleanPayload }) // Sending the parsed object
      .select("id")
      .single();

    if (error) throw error;

    // 3. RE-PACK & SWAP: Update Realm with new ID
    realm.write(() => {
      realm.create(
        LOCAL_TABLE_NAME,
        {
          _id: data.id,
          json_blob: JSON.stringify(cleanPayload),
          sync_status: "synced",
          sync_error_details: undefined,
        },
        Realm.UpdateMode.Modified,
      );

      const oldObj = realm.objectForPrimaryKey(LOCAL_TABLE_NAME, tempId);
      if (oldObj) realm.delete(oldObj);
    });
  },

  async handleUpdate(realm: Realm, task: JsonBlobTask) {
    // 1. UNPACK
    const payload = task.parsed;

    // 2. SEND
    const { error } = await supabase
      .from(REMOTE_TABLE_NAME)
      .update({ json: payload })
      .eq("id", task._id);

    if (error) throw error;

    // 3. UPDATE STATUS
    realm.write(() => {
      task.sync_status = "synced";
      task.sync_error_details = undefined;
    });
  },

  async handleDelete(realm: Realm, task: JsonBlobTask) {
    const { error } = await supabase
      .from(REMOTE_TABLE_NAME)
      .delete()
      .eq("id", task._id);

    if (error) throw error;

    realm.write(() => {
      realm.delete(task);
    });
  },
};
