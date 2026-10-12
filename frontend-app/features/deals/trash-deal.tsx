import type { Deal } from './deal'
export const removeDeal = (deals: Deal[], id: number) => deals.filter(deal => deal.id !== id)