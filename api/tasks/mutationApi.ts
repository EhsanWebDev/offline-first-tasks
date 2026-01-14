import { supabase } from "@/utils/supabase";

export const updateTask = async (
  id: string,
  data: {
    title: string;
    description?: string;
    priority: "low" | "medium" | "high";
    due_date?: string;
    is_completed: boolean;
  }
) => {
  const { data: updatedData, error } = await supabase
    .from("tasks")
    .update(data)
    .eq("id", id);
  if (error) {
    throw error;
  }
  console.log("data", data);
  console.log("id", id);
  console.log("updatedData", updatedData);
  return updatedData;
};

export const createTask = async (data: {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  due_date?: string;
  image_url?: string;
}) => {
  const { data: createdData, error } = await supabase
    .from("tasks")
    .insert(data);
  if (error) {
    throw error;
  }
  return createdData;
};

export const deleteTask = async (id: string) => {
  const { data: deletedData, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id);
  if (error) {
    throw error;
  }
  return deletedData;
};
