import type { AdminRole } from './admin'
export interface AdminUser { id: string; name: string; role: AdminRole }
export const activeAdmins = (users: AdminUser[]) => users.filter(user => user.role !== 'member')