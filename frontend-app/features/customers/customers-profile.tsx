import type { Customer } from './customer'
export const customerHealth = (customer: Customer) => customer.score >= 80 ? 'healthy' : customer.score >= 50 ? 'watch' : 'risk'