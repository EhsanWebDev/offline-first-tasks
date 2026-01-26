import { Realm } from "realm";

export class TaskMediaEmbedded extends Realm.Object<TaskMediaEmbedded> {
  id!: string;
  url!: string;
  type!: "image" | "video";
  created_at!: Date;
  task_id!: string;

  static schema: Realm.ObjectSchema = {
    name: "TaskMediaEmbedded",
    embedded: true,
    properties: {
      id: "string",
      url: "string",
      type: "string",
      created_at: "date",
      task_id: "string",
    },
  };
}
