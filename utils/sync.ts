import Realm from "realm";
import { Task } from "../db/realm/schemas/Task";
import { SyncState } from "../db/realm/schemas/SyncState";
import { pushPendingChanges } from "./syncQueue";
import { supabase } from "./supabase";

/**
 * Get or create the singleton SyncState object
 */
const getSyncState = (realm: Realm): SyncState => {
  let syncState = realm.objectForPrimaryKey<SyncState>("SyncState", "singleton");
  if (!syncState) {
    realm.write(() => {
      syncState = realm.create<SyncState>("SyncState", {
        id: "singleton",
        lastSyncedAt: new Date(0),
      });
    });
  }
  return syncState!;
};

/**
 * Convert Supabase task to Realm Task format
 */
const supabaseTaskToRealm = (realm: Realm, supabaseTask: any): Task => {
  // Check if task already exists by serverId or id
  let task = realm.objects<Task>("Task").filtered("serverId == $0", supabaseTask.id)[0] || 
             realm.objects<Task>("Task").filtered("id == $0", supabaseTask.id)[0] || 
             null;

  const taskData = {
    _id: task?._id || new Realm.BSON.ObjectId(),
    id: supabaseTask.id, // Use Supabase UUID as the id
    title: supabaseTask.title,
    description: supabaseTask.description || undefined,
    due_date: supabaseTask.due_date ? new Date(supabaseTask.due_date) : undefined,
    is_completed: supabaseTask.is_completed,
    priority: supabaseTask.priority,
    created_at: new Date(supabaseTask.created_at),
    updated_at: new Date(supabaseTask.updated_at),
    sync_status: "synced" as const,
    sync_error_message: undefined,
    serverId: supabaseTask.id, // Store Supabase UUID as serverId
    comments: [], // Comments/media will be handled separately if needed
    media: [],
    commentsCount: supabaseTask.task_comments?.[0]?.count || 0,
    mediaCount: supabaseTask.task_media?.[0]?.count || 0,
  };

  if (task) {
    // Update existing task
    realm.write(() => {
      Object.assign(task, taskData);
    });
    return task;
  } else {
    // Create new task
    let newTask: Task;
    realm.write(() => {
      newTask = realm.create<Task>("Task", taskData);
    });
    return newTask!;
  }
};

/**
 * Pull tasks from Supabase and upsert into Realm
 */
const pullTasks = async (realm: Realm, lastSyncedAt: Date): Promise<void> => {
  console.log(`📥 Pulling tasks since: ${lastSyncedAt.toISOString()}`);

  let query = supabase
    .from("tasks")
    .select("*, task_comments(count), task_media(count)")
    .order("created_at", { ascending: false });

  if (lastSyncedAt.getTime() > 0) {
    // Delta sync - fetch only updated tasks
    query = query.gt("updated_at", lastSyncedAt.toISOString());
  }

  const { data: supabaseTasks, error } = await query;

  if (error) {
    console.error("❌ Pull error:", error);
    throw new Error(`Pull failed: ${error.message}`);
  }

  console.log(`✅ Pulled ${supabaseTasks?.length || 0} tasks from Supabase`);

  // Upsert tasks into Realm
  if (supabaseTasks && supabaseTasks.length > 0) {
    realm.write(() => {
      supabaseTasks.forEach((supabaseTask) => {
        supabaseTaskToRealm(realm, supabaseTask);
      });
    });
  }
};

/**
 * Main sync function: push local changes, then pull remote changes
 */
export async function mySync(realm: Realm): Promise<void> {
  console.log("🔄 Starting Realm <-> Supabase sync...");

  try {
    // 1. PUSH: Send local pending changes to Supabase
    console.log("📤 Pushing local changes...");
    const pushResult = await pushPendingChanges(realm);
    console.log(
      `✅ Push complete: ${pushResult.success} succeeded, ${pushResult.failed} failed`
    );

    // 2. PULL: Fetch remote changes and update local Realm
    const syncState = getSyncState(realm);
    await pullTasks(realm, syncState.lastSyncedAt);

    // 3. Update lastSyncedAt
    realm.write(() => {
      syncState.lastSyncedAt = new Date();
    });

    console.log("🎉 Sync completed successfully!");
  } catch (error) {
    console.error("❌ Sync error:", error);
    throw error;
  }
}
