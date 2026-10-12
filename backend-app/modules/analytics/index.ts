export const conversionRate = (won: number, total: number) => total > 0 ? Math.round(won / total * 1000) / 10 : 0
export const weightedRevenue = (deals: Array<{ value: number; probability: number }>) => deals.reduce((sum, deal) => sum + deal.value * deal.probability / 100, 0)
