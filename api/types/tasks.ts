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
  task_comments?: { count: number }[];
  task_media?: { count: number }[];
}

export interface TaskComment {
  id: number;
  content: string;
  created_at: string;
  task_id: number;
}

export interface TaskMedia {
  id: number;
  url: string;
  type: "image" | "video";
  created_at: string;
  task_id: number;
}
