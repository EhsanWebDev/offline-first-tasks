import { supabase } from "@/utils/supabase";

export const getTaskCommentsByTaskId = async (taskId: number) => {
  const { data, error } = await supabase
    .from("task_comments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });
  if (error) {
    throw error;
  }
  return data;
};

export const createTaskComment = async (taskId: number, content: string) => {
  const { data, error } = await supabase
    .from("task_comments")
    .insert({ task_id: taskId, content: content })
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data;
};

export const deleteTaskComment = async (commentId: number) => {
  const { data, error } = await supabase
    .from("task_comments")
    .delete()
    .eq("id", commentId);
  if (error) {
    throw error;
  }
  return data;
};
