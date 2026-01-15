import { useQuery } from "@tanstack/react-query";
import { getTaskCommentsByTaskId } from "./api";

export const useTaskCommentsByTaskId = (taskId: number) => {
  return useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: () => getTaskCommentsByTaskId(taskId),
  });
};
