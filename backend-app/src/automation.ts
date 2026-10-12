import type { AdaptiveSignal, DealRecord, TaskRecord } from './domain.js'

export function createSignals(deals: DealRecord[], tasks: TaskRecord[]): AdaptiveSignal[] {
  const signals: AdaptiveSignal[] = []
  for (const deal of deals) {
    const daysIdle = Math.floor((Date.now() - deal.updatedAt.getTime()) / 86400000)
    if (daysIdle >= 7 && deal.stage !== 'Закрито') signals.push({
      kind: 'deal_risk', title: 'Ризик угоди', description: `${deal.company} без активності ${daysIdle} днів.`,
      priority: daysIdle >= 14 ? 'high' : 'medium', entityId: deal.id,
    })
  }
  for (const task of tasks) {
    if (!task.completedAt && task.dueAt.getTime() < Date.now()) signals.push({
      kind: 'task', title: 'Прострочена задача', description: task.title, priority: 'high', entityId: task.id,
    })
  }
  return signals.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
}

export class AutomationEngine {
  constructor(private readonly onSignal: (signal: AdaptiveSignal) => Promise<void>) {}
  async evaluate(deals: DealRecord[], tasks: TaskRecord[]) {
    for (const signal of createSignals(deals, tasks)) await this.onSignal(signal)
  }
}
