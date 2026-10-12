export interface Organization { id: string; name: string; ownerId: string }
export const organizationSlug = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9а-яієїґ]+/gi, '-').replace(/^-|-$/g, '')
