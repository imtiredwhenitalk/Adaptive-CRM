import type { NextFunction, Request, Response } from 'express'

export interface AuditEvent { action: string; userId?: string; path: string; at: Date }
export const auditEvents: AuditEvent[] = []
export function audit(action: string) {
  return (req: Request & { userId?: string }, _res: Response, next: NextFunction) => {
    auditEvents.push({ action, userId: req.userId, path: req.path, at: new Date() })
    next()
  }
}