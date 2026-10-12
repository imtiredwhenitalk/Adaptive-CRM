import type { AdminRole } from './admin'
export const changeAdminRole = (role: AdminRole, nextRole: AdminRole) => role === 'owner' ? nextRole : role