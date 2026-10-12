import type { NextFunction, Request, Response } from 'express'

export function requireJson(req: Request, res: Response, next: NextFunction) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) return res.status(415).json({ error: 'JSON_REQUIRED' })
  next()
}