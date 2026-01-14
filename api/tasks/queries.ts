import { useQuery } from "@tanstack/react-query";
import { getTaskById, getTasks } from "./get";

export const useTasks = () => {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
  });
};

export const useTaskById = (id: string) => {
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => getTaskById(id),
  });
};
