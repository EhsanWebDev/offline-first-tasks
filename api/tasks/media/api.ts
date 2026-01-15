import { supabase } from "@/utils/supabase";

export const getTaskMediaByTaskId = async (taskId: number) => {
  const { data, error } = await supabase
    .from("task_media")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });
  if (error) {
    throw error;
  }
  return data;
};

export const createTaskMedia = async (
  taskId: number,
  url: string,
  type: "image" | "video"
) => {
  const { data, error } = await supabase
    .from("task_media")
    .insert({ task_id: taskId, url, type })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteTaskMedia = async (mediaId: number) => {
  const { error } = await supabase
    .from("task_media")
    .delete()
    .eq("id", mediaId);
  if (error) throw error;
  return;
};
