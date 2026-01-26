import axios from "axios";

// TODO: Replace with your actual backend API base URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://your-api.com/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface TaskPayload {
  id?: string;
  title: string;
  description?: string;
  dueDate?: string;
  isCompleted: boolean;
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
  comments?: Array<{
    id: string;
    content: string;
    createdAt: string;
    taskId: string;
  }>;
  media?: Array<{
    id: string;
    url: string;
    type: "image" | "video";
    createdAt: string;
    taskId: string;
  }>;
}

export interface TaskResponse extends TaskPayload {
  id: string;
}

/**
 * Create a new task on the backend
 */
export const createTaskOnBackend = async (task: TaskPayload): Promise<TaskResponse> => {
  const response = await apiClient.post<TaskResponse>("/tasks", task);
  return response.data;
};

/**
 * Update an existing task on the backend
 */
export const updateTaskOnBackend = async (
  taskId: string,
  task: Partial<TaskPayload>
): Promise<TaskResponse> => {
  const response = await apiClient.put<TaskResponse>(`/tasks/${taskId}`, task);
  return response.data;
};

/**
 * Delete a task on the backend
 */
export const deleteTaskOnBackend = async (taskId: string): Promise<void> => {
  await apiClient.delete(`/tasks/${taskId}`);
};

/**
 * Fetch tasks that have been updated since a given timestamp
 */
export const fetchTasksSince = async (
  lastSyncedAt: Date
): Promise<TaskResponse[]> => {
  const response = await apiClient.get<TaskResponse[]>("/tasks", {
    params: {
      updatedSince: lastSyncedAt.toISOString(),
    },
  });
  return response.data;
};

/**
 * Fetch all tasks (for initial sync)
 */
export const fetchAllTasks = async (): Promise<TaskResponse[]> => {
  const response = await apiClient.get<TaskResponse[]>("/tasks");
  return response.data;
};
