import type { Role } from './admin.js'
import { can } from './admin.js'

export function changeRole(actorRole: Role, nextRole: Role, targetUserId: string) {
  if (!can(actorRole, 'manageUsers')) throw new Error('FORBIDDEN')
  return { targetUserId, role: nextRole, changedAt: new Date() }
}