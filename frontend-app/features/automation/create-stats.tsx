export interface StatsInput { values: number[] }
export function createStats({ values }: StatsInput) {
  const total = values.reduce((sum, value) => sum + value, 0)
  return { total, average: values.length ? total / values.length : 0, maximum: Math.max(0, ...values) }
}