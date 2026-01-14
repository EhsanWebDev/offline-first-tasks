import { supabase } from "@/utils/supabase";

export const getTasks = async () => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    throw error;
  }
  return data;
};

export const getTaskById = async (id: string) => {
  const { data, error } = await supabase.from("tasks").select("*").eq("id", id);
  if (error) {
    throw error;
  }
  return data;
};
