export const customerHealth = (score: number): 'healthy' | 'watch' | 'risk' => score >= 80 ? 'healthy' : score >= 50 ? 'watch' : 'risk'
