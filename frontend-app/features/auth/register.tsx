import { validateLogin } from './login'
export interface RegisterPayload { name: string; email: string; password: string }
export const validateRegister = (payload: RegisterPayload) => payload.name.trim().length >= 2 && validateLogin(payload)