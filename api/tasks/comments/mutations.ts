import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTaskComment, deleteTaskComment } from "./api";

export const useAddCommentOnTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, content }: { taskId: number; content: string }) =>
      createTaskComment(taskId, content),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

export const useDeleteCommentOnTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      commentId,
    }: {
      taskId: number;
      commentId: number;
    }) => deleteTaskComment(commentId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
    },
  });
};
