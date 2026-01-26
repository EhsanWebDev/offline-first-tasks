import { TaskRow } from "@/api/types/tasks";
import { JsonTask } from "@/db/realm/schemas/Json/Task";
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
      images: row.json.images || [],
    }));
  },

  /**
   * CREATE/UPDATE: Send a task to Supabase
   * Packs the flat object back into the { id, json } shape
   */
  async upsertTask(task: JsonTask) {
    // 1. Separate ID from the rest of the data
    const { _id, ...rest } = task;

    // 2. Prepare the payload for the 'json' column
    // We explicitly reconstruct the object to avoid circular Realm references
    const jsonPayload = {
      title: rest.title,
      description: rest.description,
      is_completed: rest.is_completed,
      priority: rest.priority,
      due_date: rest.due_date,
      created_at: rest.created_at,
      images: Array.from(rest.images), // Convert Realm.List to standard Array
    };

    // 3. Send to Supabase
    const { error } = await supabase.from("tasks_json").upsert({
      id: _id,
      json: jsonPayload,
    });

    if (error) throw error;
  },

  async uploadLocalTask(task: JsonTask): Promise<number> {
    const { _id, ...rest } = task;

    // Prepare JSON payload
    const jsonPayload = {
      title: rest.title,
      description: rest.description,
      is_completed: rest.is_completed,
      priority: rest.priority,
      created_at: rest.created_at,
      images: Array.from(rest.images),
    };

    // We do NOT send 'id'. We let Postgres auto-increment it.
    // We utilize .select() to get the generated ID back immediately.
    const { data, error } = await supabase
      .from("tasks_json")
      .insert({ json: jsonPayload })
      .select("id")
      .single();

    if (error) throw error;

    return data?.id; // Return the new real int8 ID (e.g., 502)
  },
};
