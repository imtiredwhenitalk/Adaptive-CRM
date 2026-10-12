export interface Profile { name: string; email: string; role: 'owner' | 'admin' | 'member' }
export const profileLabel = (profile: Profile) => `${profile.name} · ${profile.role}`