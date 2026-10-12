export interface Task { id: number; title: string; due: string; done: boolean }
export const pendingTasks = (tasks: Task[]) => tasks.filter(task => !task.done)