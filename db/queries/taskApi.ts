
import { Priority } from "@/api/types/tasks";
import { database, tasksCollection } from "..";


export type TaskType = {
    title: string;
    description: string;
    due_date: number;
    is_completed: boolean;
    priority: Priority;
    created_at: number;
}

export const getTasks = async () => {
    const tasks = await tasksCollection.query().fetch();
    return tasks;
}

export const getTaskById = async (id: string) => {
    const task = await tasksCollection.find(id);
    return task;
}

export const createTask = async (newTask: TaskType) => {
    await database.write(async () => {
        await tasksCollection.create((task) => {
            task.title = newTask.title;
            task.description = newTask.description;
            task.due_date = newTask.due_date;
            task.is_completed = newTask.is_completed;
            task.priority = newTask.priority;
            task.created_at = newTask.created_at;
        });
    })
}
