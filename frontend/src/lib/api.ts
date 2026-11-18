export type ApiOptions = { token?: string; method?: string; body?: unknown; idempotencyKey?: string }

export const createApiClient = (baseUrl: string, fetcher: typeof fetch = fetch) => ({
  async request<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const headers = new Headers()
    if (options.token) headers.set('Authorization', `Bearer ${options.token}`)
    if (options.body !== undefined) headers.set('Content-Type', 'application/json')
    if (options.idempotencyKey) headers.set('Idempotency-Key', options.idempotencyKey)
    const response = await fetcher(`${baseUrl}${path}`, { method: options.method ?? 'GET', headers, ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}) })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : `Request failed (${response.status})`)
    return data as T
  },
})

export const api = createApiClient(import.meta.env?.VITE_API_URL ?? 'http://localhost:3000')
