import type { WorkSession } from '../bots/time/bot-time.js'
import { elapsedMinutes } from '../bots/time/bot-time-checker.js'

export function summarizeWorkTime(sessions: WorkSession[]) {
  return sessions.reduce((total, session) => total + elapsedMinutes(session, session.endedAt ?? new Date()), 0)
}