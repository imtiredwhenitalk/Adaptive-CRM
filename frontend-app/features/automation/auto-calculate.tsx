export function calculateDealScore(value: number, probability: number, daysIdle: number) {
  return Math.round(value * probability / 100 * Math.max(0.2, 1 - daysIdle / 100))
}