import { TaskRow } from "@/api/types/tasks";
import { supabase } from "@/utils/supabase";

export const RemoteTaskService = {
  /**
   * FETCH: Get all tasks from Supabase
   * Returns them in a clean format ready for Realm
   */
  async fetchAllTasks() {
    // We assume your table is named 'tasks' with columns: id, json
    const { data, error } = await supabase
      .from("tasks_json")
      .select("id, json");

    if (error) throw error;

    // Transform the "id + json" blob into a flat object for Realm
    return (data as TaskRow[]).map((row) => ({
      _id: row.id,
      ...row.json,
      // Ensure arrays are initialized even if null in JSON
      media: row.json.media || [],
      comments: row.json.comments || [],
    }));
  },
};
