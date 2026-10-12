export interface ApiResult<T> { data?: T; error?: string }
export async function apiV1<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const response = await fetch(`/api${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...init?.headers } })
  const body = await response.json().catch(() => undefined) as T | { error?: string } | undefined
  return response.ok ? { data: body as T } : { error: (body as { error?: string } | undefined)?.error ?? 'REQUEST_FAILED' }
}

export const apiGet = <T,>(path: string) => apiV1<T>(path)
export const apiPost = <T,>(path: string, body: unknown) => apiV1<T>(path, {
  method: 'POST',
  body: JSON.stringify(body),
})
export const apiDelete = (path: string) => apiV1<undefined>(path, { method: 'DELETE' })
export const apiPatch = <T,>(path: string, body: unknown) => apiV1<T>(path, {
  method: 'PATCH',
  body: JSON.stringify(body),
})