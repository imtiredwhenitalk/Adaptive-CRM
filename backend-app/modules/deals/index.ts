export const dealStages = ['Кваліфікація', 'Пропозиція', 'Переговори', 'Закрито'] as const
export const dealWeightedValue = (value: number, probability: number) => value * probability / 100
