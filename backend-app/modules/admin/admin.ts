export type Role = 'owner' | 'admin' | 'member'
export interface PermissionSet { manageUsers: boolean; manageBilling: boolean; manageWorkspace: boolean }
export const permissions: Record<Role, PermissionSet> = {
  owner: { manageUsers: true, manageBilling: true, manageWorkspace: true },
  admin: { manageUsers: true, manageBilling: false, manageWorkspace: true },
  member: { manageUsers: false, manageBilling: false, manageWorkspace: false },
}
export function can(role: Role, permission: keyof PermissionSet) { return permissions[role][permission] }