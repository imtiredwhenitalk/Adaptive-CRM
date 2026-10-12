import type { Task } from './main-task'
export const archiveCompletedTasks = (tasks: Task[]) => tasks.filter(task => !task.done)