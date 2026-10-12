export interface LogEntry { level: 'info' | 'warn' | 'error'; message: string; context?: Record<string, unknown>; at: Date }
export const createLogEntry = (level: LogEntry['level'], message: string, context?: Record<string, unknown>): LogEntry => ({ level, message, context, at: new Date() })
