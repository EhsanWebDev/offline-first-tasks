import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTaskMedia, deleteTaskMedia } from "./api";

export const useCreateTaskMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      url,
      type,
    }: {
      taskId: number;
      url: string;
      type: "image" | "video";
    }) => createTaskMedia(taskId, url, type),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["task-media", taskId] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

export const useDeleteTaskMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, mediaId }: { taskId: number; mediaId: number }) =>
      deleteTaskMedia(mediaId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["task-media", taskId] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};
