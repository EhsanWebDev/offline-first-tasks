import { TaskMedia } from "@/api/types/tasks";
import { useQuery } from "@tanstack/react-query";
import { getTaskMediaByTaskId } from "./api";

export const useTaskMediaByTaskId = (taskId: number) => {
  return useQuery<TaskMedia[]>({
    queryKey: ["task-media", taskId],
    queryFn: () => getTaskMediaByTaskId(taskId),
  });
};
