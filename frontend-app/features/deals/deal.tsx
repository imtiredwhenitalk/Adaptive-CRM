export type DealStage = 'Кваліфікація' | 'Пропозиція' | 'Переговори' | 'Закрито'
export interface Deal { id: number; name: string; value: number; stage: DealStage; probability: number }
export const weightedValue = (deal: Deal) => deal.value * deal.probability / 100