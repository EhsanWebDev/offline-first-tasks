import { Realm } from "realm";

export class SyncState extends Realm.Object<SyncState> {
  id!: string;
  lastSyncedAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: "SyncState",
    primaryKey: "id",
    properties: {
      id: { type: "string", default: "singleton" },
      lastSyncedAt: { type: "date", default: new Date(0) },
    },
  };
}
