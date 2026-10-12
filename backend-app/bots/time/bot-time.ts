export interface WorkSession { userId: string; startedAt: Date; endedAt?: Date }

export class WorkTimeBot {
  private readonly sessions = new Map<string, WorkSession>()
  start(userId: string) { const session = { userId, startedAt: new Date() }; this.sessions.set(userId, session); return session }
  stop(userId: string) {
    const session = this.sessions.get(userId)
    if (!session) return null
    session.endedAt = new Date()
    this.sessions.delete(userId)
    return session
  }
  active(userId: string) { return this.sessions.get(userId) ?? null }
}