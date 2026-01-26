import { Realm } from "realm";

export class TaskCommentEmbedded extends Realm.Object<TaskCommentEmbedded> {
  id!: string;
  content!: string;
  created_at!: Date;
  task_id!: string;

  static schema: Realm.ObjectSchema = {
    name: "TaskCommentEmbedded",
    embedded: true,
    properties: {
      id: "string",
      content: "string",
      created_at: "date",
      task_id: "string",
    },
  };
}
