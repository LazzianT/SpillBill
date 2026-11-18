import assert from 'node:assert/strict'
import test from 'node:test'
import { createApiClient } from './api.ts'

test('API client attaches bearer token and parses JSON', async () => {
  const client = createApiClient('http://localhost:3000', async (_url, init) => {
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer token-1')
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  })
  assert.deepEqual(await client.request('/customers', { token: 'token-1' }), { ok: true })
})

test('API client surfaces server errors without fixture fallback', async () => {
  const client = createApiClient('http://localhost:3000', async () => new Response(JSON.stringify({ error: 'offline' }), { status: 503 }))
  await assert.rejects(client.request('/customers'), /offline/)
})
