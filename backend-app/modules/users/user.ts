export interface User { id: string; name: string; email: string; createdAt: Date }
export function publicUser(user: User) { return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt } }
export function userInitials(name: string) { return name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() }