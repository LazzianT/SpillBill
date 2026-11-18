import test from 'node:test'
import assert from 'node:assert/strict'
import { request } from 'node:http'
import { createApp } from '../src/app.js'
import { signToken } from '../src/auth.js'

const call = (server, path, { method = 'GET', body, headers = {} } = {}) => new Promise((resolve, reject) => {
  const address = server.address()
  const payload = body === undefined ? undefined : JSON.stringify(body)
  const req = request({ hostname: '127.0.0.1', port: address.port, path, method, headers: { ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}), ...headers } }, (response) => {
    let body = ''
    response.setEncoding('utf8')
    response.on('data', (chunk) => { body += chunk })
    response.on('end', () => resolve({ statusCode: response.statusCode, body: JSON.parse(body) }))
  })
  req.on('error', reject)
  req.end(payload)
})

const get = (server, path) => call(server, path)

test('login authenticates active user with stored bcrypt hash and returns signed token', async () => {
  const { default: bcrypt } = await import('bcryptjs')
  const passwordHash = await bcrypt.hash('sales123', 4)
  const pool = { execute: async (sql, values) => {
    assert.match(sql, /FROM users WHERE username = \? AND active = TRUE/)
    assert.deepEqual(values, ['admin.sales'])
    return [[{ id: 'user-1', username: 'admin.sales', password_hash: passwordHash, role: 'MARKETING' }]]
  } }
  const server = createApp({ pool, tokenSecret: 'a'.repeat(32) })
  await new Promise((resolve) => server.listen(0, resolve))
  try {
    const response = await call(server, '/auth/login', { method: 'POST', body: { username: 'admin.sales', password: 'sales123' } })
    assert.equal(response.statusCode, 200)
    assert.equal(response.body.user.role, 'MARKETING')
    assert.ok(response.body.token)
    assert.ok(response.body.expiresAt)
  } finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) }
})

test('login rejects invalid credentials without leaking account state', async () => {
  const pool = { execute: async () => [[]] }
  const server = createApp({ pool, tokenSecret: 'a'.repeat(32) })
  await new Promise((resolve) => server.listen(0, resolve))
  try {
    const response = await call(server, '/auth/login', { method: 'POST', body: { username: 'unknown', password: 'wrong' } })
    assert.equal(response.statusCode, 401)
    assert.deepEqual(response.body, { error: 'Invalid username or password' })
  } finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) }
})

test('login rejects missing credentials and protected routes reject missing, expired, and inactive-user tokens', async () => {
  const secret = 's'.repeat(32)
  const pool = { queries: [], execute: async (_sql, [id]) => { pool.queries.push(id); return [[id === 'active' ? { id, username: 'sales', role: 'MARKETING' } : undefined].filter(Boolean)] } }
  const server = createApp({ pool, tokenSecret: secret })
  await new Promise((resolve) => server.listen(0, resolve))
  try {
    assert.equal((await call(server, '/auth/login', { method: 'POST', body: { username: '', password: '' } })).statusCode, 400)
    const active = signToken({ id: 'active' }, secret)
    const inactive = signToken({ id: 'inactive' }, secret)
    const expired = signToken({ id: 'active' }, secret, 1, Date.now() - 10_000)
    const missing = await get(server, '/protected')
    assert.equal(missing.statusCode, 401)
    assert.deepEqual(pool.queries, [])
    assert.equal((await call(server, '/dashboard', { headers: { Authorization: `Bearer ${expired}` } })).statusCode, 401)
    assert.equal((await call(server, '/dashboard', { headers: { Authorization: `Bearer ${inactive}` } })).statusCode, 401)
    const allowed = await call(server, '/auth/session', { headers: { Authorization: `Bearer ${active}` } })
    assert.equal(allowed.statusCode, 200)
    assert.deepEqual(allowed.body.user, { id: 'active', username: 'sales', role: 'MARKETING' })
    assert.deepEqual(pool.queries, ['inactive', 'active'])
  } finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) }
})

test('customer and product APIs enforce roles, validate input, and persist through parameterized transactions', async () => {
  const secret = 'r'.repeat(32)
  const calls = []
  const connection = {
    beginTransaction: async () => calls.push('begin'),
    execute: async (sql, values = []) => { calls.push({ sql, values }); if (/SELECT c\.id/.test(sql)) return [[{ id: 'c1', name: 'Customer', contact_info: 'a@b.test | 123', orders: 0, billed: '0.00', outstanding: '0.00' }]]; if (/SELECT p\.id/.test(sql)) return [[{ id: 'p1', name: 'Product', unit_price: '25.00', active: 1, used_in: 0 }]]; return [{ affectedRows: 1 }] },
    commit: async () => calls.push('commit'), rollback: async () => calls.push('rollback'), release: () => calls.push('release'),
  }
  const pool = { execute: connection.execute, getConnection: async () => connection, query: connection.execute }
  const users = { marketing: { id: 'm1', username: 'sales', role: 'MARKETING' }, accounting: { id: 'a1', username: 'finance', role: 'ACCOUNTING' } }
  pool.execute = async (sql, values) => sql.includes('FROM users WHERE id') ? [[users[values[0]]].filter(Boolean)] : connection.execute(sql, values)
  const server = createApp({ pool, tokenSecret: secret })
  await new Promise((resolve) => server.listen(0, resolve))
  try {
    const marketing = signToken({ id: 'marketing' }, secret)
    const accounting = signToken({ id: 'accounting' }, secret)
    const denied = await call(server, '/customers', { method: 'POST', headers: { Authorization: `Bearer ${accounting}` }, body: { name: 'Nope' } })
    assert.equal(denied.statusCode, 403)
    const invalid = await call(server, '/customers', { method: 'POST', headers: { Authorization: `Bearer ${marketing}` }, body: { name: ' ' } })
    assert.equal(invalid.statusCode, 400)
    const created = await call(server, '/customers', { method: 'POST', headers: { Authorization: `Bearer ${marketing}` }, body: { name: 'New Customer', contactInfo: 'x@y.test | 555' } })
    assert.equal(created.statusCode, 201)
    assert.equal(calls[0], 'begin')
    assert.ok(calls.some((entry) => typeof entry === 'object' && entry.sql.includes('INSERT INTO customers') && entry.values.includes('New Customer')))
    assert.ok(calls.includes('commit'))
    assert.equal((await call(server, '/products', { headers: { Authorization: `Bearer ${accounting}` } })).statusCode, 200)
  } finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) }
})

test('sales orders deny finance writes, accept marketing create and cancel transitions', async () => {
  const secret = 't'.repeat(32)
  const calls = []
  const connection = { beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release() {}, execute: async (sql) => { calls.push(sql); return sql.includes('SELECT so.id') ? [[{ id: '10000000-0000-0000-0000-000000000001' }]] : [{ affectedRows: 1 }] } }
  const users = { m: { id: 'm', username: 'sales', role: 'MARKETING' }, a: { id: 'a', username: 'finance', role: 'ACCOUNTING' } }
  const pool = { getConnection: async () => connection, execute: async (sql, [id]) => sql.includes('FROM users WHERE id') ? [[users[id]].filter(Boolean)] : [[]] }
  const server = createApp({ pool, tokenSecret: secret })
  await new Promise((resolve) => server.listen(0, resolve))
  try {
    const finance = signToken({ id: 'a' }, secret)
    const marketing = signToken({ id: 'm' }, secret)
    assert.equal((await call(server, '/sales-orders', { method: 'POST', headers: { Authorization: `Bearer ${finance}` }, body: {} })).statusCode, 403)
    assert.equal((await call(server, '/sales-orders/10000000-0000-0000-0000-000000000001/cancel', { method: 'POST', headers: { Authorization: `Bearer ${marketing}` } })).statusCode, 200)
    const archiveResponse = await call(server, '/sales-orders/10000000-0000-0000-0000-000000000001', { method: 'DELETE', headers: { Authorization: `Bearer ${marketing}` } })
    assert.equal(archiveResponse.statusCode, 200)
    assert.deepEqual(archiveResponse.body, { archived: true })
    assert.equal((await call(server, '/sales-orders/10000000-0000-0000-0000-000000000001', { method: 'DELETE', headers: { Authorization: `Bearer ${finance}` } })).statusCode, 403)
    assert.ok(calls.some((sql) => sql.includes("SET status = 'CANCELLED'")))
  } finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) }
})

test('invoice and payment mutations enforce Accounting-only writes', async () => {
  const secret = 'i'.repeat(32)
  const calls = []
  const users = { m: { id: 'm', username: 'sales', role: 'MARKETING' }, a: { id: 'a', username: 'finance', role: 'ACCOUNTING' } }
  const pool = { execute: async (sql, [id]) => sql.includes('FROM users WHERE id') ? [[users[id]].filter(Boolean)] : (calls.push(sql), [[]]) }
  const server = createApp({ pool, tokenSecret: secret })
  await new Promise((resolve) => server.listen(0, resolve))
  try {
    const marketing = signToken({ id: 'm' }, secret)
    const accounting = signToken({ id: 'a' }, secret)
    assert.equal((await call(server, '/invoices', { method: 'POST', headers: { Authorization: `Bearer ${marketing}` }, body: {} })).statusCode, 403)
    assert.equal((await call(server, '/payments', { method: 'POST', headers: { Authorization: `Bearer ${marketing}`, 'Idempotency-Key': '60000000-0000-4000-8000-000000000001' }, body: {} })).statusCode, 403)
    assert.deepEqual(calls, [])
    const invalidPayment = await call(server, '/payments', { method: 'POST', headers: { Authorization: `Bearer ${accounting}`, 'Idempotency-Key': '60000000-0000-4000-8000-000000000001' }, body: {} })
    assert.equal(invalidPayment.statusCode, 400)
  } finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) }
})

test('health endpoint returns service status', async () => {
  const server = createApp({ corsOrigin: 'http://localhost:5173' })
  await new Promise((resolve) => server.listen(0, resolve))

  try {
    const response = await get(server, '/health')
    assert.equal(response.statusCode, 200)
    assert.deepEqual(response.body, { status: 'ok', service: 'spillbill-api' })
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
})
