export interface AnalyticsPoint { label: string; value: number }
export function growthRate(current: number, previous: number) { return previous === 0 ? 0 : Math.round((current - previous) / previous * 1000) / 10 }
export const sortPoints = (points: AnalyticsPoint[]) => [...points].sort((a, b) => b.value - a.value)