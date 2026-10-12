import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
export async function hashPassword(password: string) { return bcrypt.hash(password, 12) }
export async function verifyPassword(password: string, hash: string) { return bcrypt.compare(password, hash) }
export function createSessionToken() { return crypto.randomBytes(32).toString('hex') }
export function sessionExpiresAt(now = Date.now()) { return new Date(now + SESSION_TTL_MS) }