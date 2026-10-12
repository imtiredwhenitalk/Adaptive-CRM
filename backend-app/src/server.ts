import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import crypto from 'node:crypto'
import express, { type NextFunction, type Request, type Response } from 'express'
import { Pool } from 'pg'
import { z } from 'zod'
import { createSignals } from './automation.js'
import type { DealRecord, TaskRecord } from './domain.js'
import { requestLogger } from '../middleware/logger.js'
import { AutomationEngine } from './automation.js'
import { BotLogger } from '../bots/automation/bot-logger.js'

const app = express()
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const port = Number(process.env.PORT || 4000)
const sessionDays = 30
const authCookie = 'adaptive_session'

app.use(cors({ origin: process.env.WEB_ORIGIN || 'http://localhost:8080', credentials: true }))
app.use(express.json({ limit: '64kb' }))
app.use(cookieParser())
app.use(requestLogger)

const userSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(255), password: z.string().min(8).max(128) })
const contactSchema = z.object({ name: z.string().trim().min(2).max(120), company: z.string().trim().min(1).max(160), email: z.string().trim().email().max(255) })
const dealSchema = z.object({ name: z.string().trim().min(2).max(160), company: z.string().trim().min(1).max(160), value: z.number().finite().nonnegative(), stage: z.enum(['Кваліфікація', 'Пропозиція', 'Переговори', 'Закрито']), probability: z.number().int().min(0).max(100) })
const taskSchema = z.object({ title: z.string().trim().min(2).max(240), dueAt: z.coerce.date() })
type AuthRequest = Request & { userId?: string }

async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies[authCookie]
  if (!token) return res.status(401).json({ error: 'AUTH_REQUIRED' })
  const result = await pool.query<{ user_id: string }>('SELECT user_id FROM sessions WHERE token = $1 AND expires_at > now()', [token])
  if (!result.rowCount) return res.status(401).json({ error: 'SESSION_EXPIRED' })
  req.userId = result.rows[0].user_id
  return next()
}

app.get('/health', async (_req, res) => {
  await pool.query('SELECT 1')
  res.json({ status: 'ok' })
})

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const data = userSchema.parse(req.body)
    const passwordHash = await bcrypt.hash(data.password, 12)
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const user = await client.query<{ id: string; name: string; email: string }>('INSERT INTO users (name, email, password_hash) VALUES ($1, lower($2), $3) RETURNING id, name, email', [data.name, data.email, passwordHash])
      const token = crypto.randomBytes(32).toString('hex')
      await client.query("INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, now() + interval '30 days')", [token, user.rows[0].id])
      await client.query('COMMIT')
      res.cookie(authCookie, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: sessionDays * 86400000 })
      return res.status(201).json({ user: user.rows[0] })
    } catch (error: unknown) {
      await client.query('ROLLBACK')
      if (error instanceof Error && error.message.includes('users_email_key')) return res.status(409).json({ error: 'EMAIL_EXISTS' })
      throw error
    } finally { client.release() }
  } catch (error) { return next(error) }
})

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const data = userSchema.pick({ email: true, password: true }).parse(req.body)
    const result = await pool.query<{ id: string; name: string; email: string; password_hash: string }>('SELECT id, name, email, password_hash FROM users WHERE email = lower($1)', [data.email])
    if (!result.rowCount || !(await bcrypt.compare(data.password, result.rows[0].password_hash))) return res.status(401).json({ error: 'INVALID_CREDENTIALS' })
    const token = crypto.randomBytes(32).toString('hex')
    await pool.query("INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, now() + interval '30 days')", [token, result.rows[0].id])
    res.cookie(authCookie, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: sessionDays * 86400000 })
    return res.json({ user: { id: result.rows[0].id, name: result.rows[0].name, email: result.rows[0].email } })
  } catch (error) { return next(error) }
})

app.post('/api/auth/logout', async (req, res, next) => {
  try { if (req.cookies[authCookie]) await pool.query('DELETE FROM sessions WHERE token = $1', [req.cookies[authCookie]]); res.clearCookie(authCookie); return res.status(204).end() } catch (error) { return next(error) }
})

app.get('/api/auth/me', authenticate, async (req: AuthRequest, res, next) => {
  try { const result = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.userId]); return res.json({ user: result.rows[0] }) } catch (error) { return next(error) }
})

app.get('/api/contacts', authenticate, async (req: AuthRequest, res, next) => {
  try { const result = await pool.query('SELECT id, name, company, email, status, score, created_at FROM contacts WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]); return res.json({ contacts: result.rows }) } catch (error) { return next(error) }
})
app.post('/api/contacts', authenticate, async (req: AuthRequest, res, next) => {
  try { const data = contactSchema.parse(req.body); const result = await pool.query('INSERT INTO contacts (user_id, name, company, email) VALUES ($1, $2, $3, lower($4)) RETURNING *', [req.userId, data.name, data.company, data.email]); return res.status(201).json({ contact: result.rows[0] }) } catch (error) { return next(error) }
})
app.delete('/api/contacts/:id', authenticate, async (req: AuthRequest, res, next) => {
  try { const result = await pool.query('DELETE FROM contacts WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]); return result.rowCount ? res.status(204).end() : res.status(404).json({ error: 'CONTACT_NOT_FOUND' }) } catch (error) { return next(error) }
})

app.get('/api/deals', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await pool.query('SELECT id, name, company, value, stage, probability, updated_at FROM deals WHERE user_id = $1 ORDER BY updated_at DESC', [req.userId])
    return res.json({ deals: result.rows })
  } catch (error) { return next(error) }
})
app.post('/api/deals', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = dealSchema.parse(req.body)
    const result = await pool.query('INSERT INTO deals (user_id, name, company, value, stage, probability) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [req.userId, data.name, data.company, data.value, data.stage, data.probability])
    return res.status(201).json({ deal: result.rows[0] })
  } catch (error) { return next(error) }
})
app.patch('/api/deals/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = dealSchema.partial().parse(req.body)
    const result = await pool.query('UPDATE deals SET name = COALESCE($1, name), company = COALESCE($2, company), value = COALESCE($3, value), stage = COALESCE($4, stage), probability = COALESCE($5, probability), updated_at = now() WHERE id = $6 AND user_id = $7 RETURNING *', [data.name, data.company, data.value, data.stage, data.probability, req.params.id, req.userId])
    return result.rowCount ? res.json({ deal: result.rows[0] }) : res.status(404).json({ error: 'DEAL_NOT_FOUND' })
  } catch (error) { return next(error) }
})
app.delete('/api/deals/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await pool.query('DELETE FROM deals WHERE id = $1 AND user_id = $2', [req.params.id, req.userId])
    return result.rowCount ? res.status(204).end() : res.status(404).json({ error: 'DEAL_NOT_FOUND' })
  } catch (error) { return next(error) }
})

app.get('/api/tasks', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await pool.query('SELECT id, title, due_at, completed_at FROM tasks WHERE user_id = $1 ORDER BY due_at ASC', [req.userId])
    return res.json({ tasks: result.rows })
  } catch (error) { return next(error) }
})
app.post('/api/tasks', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = taskSchema.parse(req.body)
    const result = await pool.query('INSERT INTO tasks (user_id, title, due_at) VALUES ($1, $2, $3) RETURNING *', [req.userId, data.title, data.dueAt])
    return res.status(201).json({ task: result.rows[0] })
  } catch (error) { return next(error) }
})
app.patch('/api/tasks/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = z.object({ completed: z.boolean().optional(), title: z.string().trim().min(2).max(240).optional(), dueAt: z.coerce.date().optional() }).parse(req.body)
    const result = await pool.query('UPDATE tasks SET title = COALESCE($1, title), due_at = COALESCE($2, due_at), completed_at = CASE WHEN $3 IS NULL THEN completed_at WHEN $3 THEN COALESCE(completed_at, now()) ELSE NULL END WHERE id = $4 AND user_id = $5 RETURNING *', [data.title, data.dueAt, data.completed, req.params.id, req.userId])
    return result.rowCount ? res.json({ task: result.rows[0] }) : res.status(404).json({ error: 'TASK_NOT_FOUND' })
  } catch (error) { return next(error) }
})
app.delete('/api/tasks/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [req.params.id, req.userId])
    return result.rowCount ? res.status(204).end() : res.status(404).json({ error: 'TASK_NOT_FOUND' })
  } catch (error) { return next(error) }
})

app.get('/api/signals', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const [deals, tasks] = await Promise.all([
      pool.query<DealRecord>('SELECT id, user_id AS "userId", name, company, value, stage, probability, updated_at AS "updatedAt" FROM deals WHERE user_id = $1', [req.userId]),
      pool.query<TaskRecord>('SELECT id, user_id AS "userId", title, due_at AS "dueAt", completed_at AS "completedAt" FROM tasks WHERE user_id = $1', [req.userId]),
    ])
    return res.json({ signals: createSignals(deals.rows, tasks.rows) })
  } catch (error) { return next(error) }
})

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) return res.status(400).json({ error: 'VALIDATION_ERROR', details: error.issues })
  console.error(error)
  return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' })
})

async function start() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto')
  await pool.query(`CREATE TABLE IF NOT EXISTS users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, email text NOT NULL UNIQUE, password_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE IF NOT EXISTS sessions (token text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL);
    CREATE TABLE IF NOT EXISTS contacts (id bigserial PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, name text NOT NULL, company text NOT NULL, email text NOT NULL, status text NOT NULL DEFAULT 'Нова', score integer NOT NULL DEFAULT 70, created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE IF NOT EXISTS deals (id bigserial PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, name text NOT NULL, company text NOT NULL, value numeric NOT NULL DEFAULT 0, stage text NOT NULL DEFAULT 'Кваліфікація', probability integer NOT NULL DEFAULT 20, updated_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE IF NOT EXISTS tasks (id bigserial PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, title text NOT NULL, due_at timestamptz NOT NULL, completed_at timestamptz);`)
  const botLogger = new BotLogger()
  const automation = new AutomationEngine(async signal => botLogger.record(signal))
  setInterval(async () => {
    try {
      const [deals, tasks] = await Promise.all([
        pool.query<DealRecord>('SELECT id, user_id AS "userId", name, company, value, stage, probability, updated_at AS "updatedAt" FROM deals WHERE stage != $1', ['Закрито']),
        pool.query<TaskRecord>('SELECT id, user_id AS "userId", title, due_at AS "dueAt", completed_at AS "completedAt" FROM tasks WHERE completed_at IS NULL'),
      ])
      await automation.evaluate(deals.rows, tasks.rows)
    } catch (error) { console.error('[adaptive-bot] evaluation failed', error) }
  }, 5 * 60 * 1000).unref()
  app.listen(port, () => console.log(`Adaptive API listening on :${port}`))
}
start().catch(error => { console.error(error); process.exit(1) })
