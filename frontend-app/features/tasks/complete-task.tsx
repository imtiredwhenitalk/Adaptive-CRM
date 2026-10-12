import type { Task } from './main-task'
export const completeTask = (tasks: Task[], id: number) => tasks.map(task => task.id === id ? { ...task, done: true } : task)