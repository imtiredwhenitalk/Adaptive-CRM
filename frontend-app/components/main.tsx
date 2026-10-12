import type { ReactNode } from 'react'

export interface MainLayoutProps { children: ReactNode; title?: string }
export function MainLayout({ children, title = 'Adaptive CRM' }: MainLayoutProps) {
  return <main aria-label={title}>{children}</main>
}
