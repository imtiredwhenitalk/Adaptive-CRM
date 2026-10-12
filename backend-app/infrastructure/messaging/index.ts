export interface Message { to: string; subject: string; body: string }
export const createMessage = (to: string, subject: string, body: string): Message => ({ to: to.trim().toLowerCase(), subject: subject.trim(), body })
