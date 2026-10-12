import type { AdaptiveSignal } from '../../src/domain.js'

export class BotLogger {
  private readonly history: AdaptiveSignal[] = []
  record(signal: AdaptiveSignal) {
    this.history.push(signal)
    console.info(`[adaptive-bot] ${signal.priority.toUpperCase()}: ${signal.title} — ${signal.description}`)
  }
  list() { return [...this.history] }
}