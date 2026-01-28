import { createRealmContext } from "@realm/react";
import Realm from "realm";
import { JsonBlobTask } from "./schemas/Json/JsonTask";
import { JsonTask } from "./schemas/Json/Task";
import { SyncState } from "./schemas/SyncState";
import { Task } from "./schemas/Task";
import { TaskCommentEmbedded } from "./schemas/TaskCommentEmbedded";
import { TaskMediaEmbedded } from "./schemas/TaskMediaEmbedded";

// Export schema classes for use in RealmProvider
export const realmSchemas = [
  JsonTask,
  JsonBlobTask,
  Task,
  TaskCommentEmbedded,
  TaskMediaEmbedded,
  SyncState,
];

// Export types
export type { SyncState } from "./schemas/SyncState";
export { SyncStatus } from "./schemas/Task";
export type { Task } from "./schemas/Task";
export type { TaskCommentEmbedded } from "./schemas/TaskCommentEmbedded";
export type { TaskMediaEmbedded } from "./schemas/TaskMediaEmbedded";

// Create and export Realm instance
let realmInstance: Realm | null = null;

export const getRealm = async (): Promise<Realm> => {
  if (realmInstance && !realmInstance.isClosed) {
    return realmInstance;
  }

  realmInstance = await Realm.open({
    schema: realmSchemas,
    schemaVersion: 2,
  });

  return realmInstance;
};

// Helper to close Realm (useful for cleanup)
export const closeRealm = () => {
  if (realmInstance && !realmInstance.isClosed) {
    realmInstance.close();
    realmInstance = null;
  }
};

const realmConfig = {
  schema: realmSchemas,

  // 1. INCREMENT THIS VERSION (e.g. if it was 1, make it 2)
  schemaVersion: 1,

  // // 2. Define how to update old data to new structure
  // onMigration: (oldRealm: Realm, newRealm: Realm) => {
  //   // Only run this if moving from version 1 to 2
  //   if (oldRealm.schemaVersion < 2) {
  //     const oldObjects = oldRealm.objects("JsonTask");
  //     const newObjects = newRealm.objects("JsonTask");

  //     // Iterate through all existing tasks
  //     for (let i = 0; i < oldObjects.length; i++) {
  //       const oldObj = oldObjects[i];
  //       const newObj = newObjects[i];

  //       // A. Handle 'sync_status'
  //       // Since these items already existed, they are likely 'synced' (or whatever default you prefer)
  //       newObj.sync_status = "synced";

  //       // B. Handle 'sync_error_details'
  //       newObj.sync_error_details = null;

  //       // C. Handle Optional Fields (comments_count, media_count)
  //       // Realm automatically converts int -> int?, so usually no code is needed here.
  //       // But if you wanted to set nulls for 0s, you could do it here.
  //     }
  //   }
  // },
};

export const { RealmProvider, useRealm, useQuery, useObject } =
  createRealmContext(realmConfig);
