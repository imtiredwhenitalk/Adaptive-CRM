import type { Deal } from './deal'
export const archiveDeals = (deals: Deal[], ids: number[]) => deals.filter(deal => ids.includes(deal.id))