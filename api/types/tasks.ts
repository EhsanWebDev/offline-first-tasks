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

export interface TaskRow {
  id: number;
  json: {
    title: string;
    description?: string;
    is_completed: boolean;
    priority: "low" | "medium" | "high";
    due_date?: string;
    created_at: string;
    media?: TaskMedia[];
    comments?: TaskComment[];
  };
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
  type: "image" | "video" | "file";
  created_at: string;
  task_id: number;
}
