export type SignalKind = 'contact' | 'deal_risk' | 'task'
export type DealStage = 'Кваліфікація' | 'Пропозиція' | 'Переговори' | 'Закрито'

export interface ContactRecord {
  id: number
  userId: string
  name: string
  company: string
  email: string
  status: string
  score: number
  createdAt: Date
}

export interface DealRecord {
  id: number
  userId: string
  name: string
  company: string
  value: number
  stage: DealStage
  probability: number
  updatedAt: Date
}

export interface TaskRecord {
  id: number
  userId: string
  title: string
  dueAt: Date
  completedAt: Date | null
}

export interface AdaptiveSignal {
  kind: SignalKind
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  entityId?: number
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase()
export const calculateScore = (daysSinceActivity: number, openedProposal: boolean) =>
  Math.max(0, Math.min(100, 100 - daysSinceActivity * 5 + (openedProposal ? 15 : 0)))
