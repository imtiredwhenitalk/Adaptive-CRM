export const taskPriority = (dueAt: Date, now = new Date()) => dueAt.getTime() < now.getTime() ? 'overdue' : 'upcoming'
