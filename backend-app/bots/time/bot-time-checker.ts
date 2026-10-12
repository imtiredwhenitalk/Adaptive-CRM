import type { WorkSession } from './bot-time.js'

export function elapsedMinutes(session: WorkSession, now = new Date()) {
  return Math.max(0, Math.round((now.getTime() - session.startedAt.getTime()) / 60000))
}

export function isLongSession(session: WorkSession, limitMinutes = 480, now = new Date()) {
  return elapsedMinutes(session, now) >= limitMinutes
}