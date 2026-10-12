import type { Role } from './admin.js'
import { can } from './admin.js'

export interface Invite { email: string; role: Role; invitedBy: string; createdAt: Date }
export function createInvite(actorRole: Role, email: string, role: Role, invitedBy: string): Invite {
  if (!can(actorRole, 'manageUsers')) throw new Error('FORBIDDEN')
  return { email: email.trim().toLowerCase(), role, invitedBy, createdAt: new Date() }
}