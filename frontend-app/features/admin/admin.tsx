export type AdminRole = 'owner' | 'admin' | 'member'
export const hasAdminAccess = (role: AdminRole) => role === 'owner' || role === 'admin'