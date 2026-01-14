export type Priority = "low" | "medium" | "high";
export interface Task {
  id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  priority: Priority;
  due_date?: string;
  created_at: string;
  image_url?: string;
}
