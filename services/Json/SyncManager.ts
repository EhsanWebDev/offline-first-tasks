import { JsonBlobTask } from "@/db/realm/schemas/Json/JsonTask";
import { supabase } from "@/utils/supabase";
import Realm from "realm";

const REMOTE_TABLE_NAME = "tasks_json";
const LOCAL_TABLE_NAME = "JsonBlobTask";

export interface SyncResult {
  total: number;
  success: number;
  failures: { id: number; reason: string }[];
}

export const SyncManager = {
  // --- 1. PULL (Download from Cloud) ---
  async pullFromCloud(realm: Realm) {
    console.log("Sync: Pulling data...");

    const { data, error } = await supabase
      .from(REMOTE_TABLE_NAME) // Your Supabase table
      .select("id, json");

    if (error) throw error;
    if (!data || data.length === 0) return;

    realm.write(() => {
      data.forEach((row: any) => {
        // We received { id: 123, json: { title: "..." } }
        // We must stringify the JSON part for Realm storage
        const blobString = JSON.stringify(row.json);

        realm.create(
          LOCAL_TABLE_NAME,
          {
            _id: row.id,
            json_blob: blobString,
            sync_status: "synced",
            sync_error_details: undefined,
          },
          Realm.UpdateMode.Modified,
        );
      });
    });
  },

  // --- 2. PUSH (Process the Queue) ---
  async processSyncQueue(
    realm: Realm,
    onProgress?: (current: number, total: number) => void,
  ): Promise<SyncResult> {
    const pendingItems = realm
      .objects<JsonBlobTask>(LOCAL_TABLE_NAME)
      .filtered("sync_status != 'synced'");

    const total = pendingItems.length;
    const result: SyncResult = { total, success: 0, failures: [] };

    if (total === 0) return result;

    const items = Array.from(pendingItems); // Snapshot for safety

    for (let i = 0; i < total; i++) {
      const task = items[i];
      if (onProgress) onProgress(i + 1, total);

      try {
        // Parse the blob once here to send to Supabase
        const payload = JSON.parse(task.json_blob);

        if (task.sync_status === "pending_creation") {
          // POST
          const { data, error } = await supabase
            .from(REMOTE_TABLE_NAME)
            .insert({ json: payload }) // Send pure JSON object
            .select("id")
            .single();

          if (error) throw error;

          // Swap ID
          realm.write(() => {
            realm.create(
              LOCAL_TABLE_NAME,
              {
                _id: data.id,
                json_blob: task.json_blob, // Keep same data
                sync_status: "synced",
                sync_error_details: undefined,
              },
              Realm.UpdateMode.Modified,
            );

            // Delete temp
            const old = realm.objectForPrimaryKey(LOCAL_TABLE_NAME, task._id);
            if (old) realm.delete(old);
          });
        } else if (task.sync_status === "pending_update") {
          // PATCH
          const { error } = await supabase
            .from(REMOTE_TABLE_NAME)
            .update({ json: payload })
            .eq("id", task._id);

          if (error) throw error;

          realm.write(() => {
            task.sync_status = "synced";
            task.sync_error_details = undefined;
          });
        } else if (task.sync_status === "pending_delete") {
          // DELETE
          const { error } = await supabase
            .from(REMOTE_TABLE_NAME)
            .delete()
            .eq("id", task._id);

          if (error) throw error;

          realm.write(() => {
            realm.delete(task);
          });
        }

        result.success++;
      } catch (err: any) {
        console.error("Sync Error", err);
        result.failures.push({ id: task._id, reason: err.message });
        realm.write(() => {
          if (task.isValid()) {
            task.sync_status = "sync_error";
            task.sync_error_details = err.message;
          }
        });
      }
    }

    return result;
  },
};
