export interface LoginPayload { email: string; password: string }
export const validateLogin = (payload: LoginPayload) => payload.email.includes('@') && payload.password.length >= 8