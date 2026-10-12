import type { FormEvent } from 'react'
export interface ContactForm { name: string; company: string; email: string }
export function readContactForm(event: FormEvent<HTMLFormElement>): ContactForm {
  const data = new FormData(event.currentTarget)
  return { name: String(data.get('name') || '').trim(), company: String(data.get('company') || '').trim(), email: String(data.get('email') || '').trim().toLowerCase() }
}