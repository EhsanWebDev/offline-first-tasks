import { Realm } from "realm";

export class TaskCommentEmbedded extends Realm.Object<TaskCommentEmbedded> {
  _id!: number;
  content!: string;
  created_at!: Date;
  task_id!: number;

  static schema: Realm.ObjectSchema = {
    name: "TaskCommentEmbedded",
    embedded: true,
    properties: {
      _id: "int",
      content: "string",
      created_at: "date",
      task_id: "int",
    },
  };
}
