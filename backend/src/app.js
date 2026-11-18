import { createServer } from 'node:http'
import { bearerToken, signToken, verifyPassword, verifyToken } from './auth.js'
import { customerRepository, productRepository, salesOrderRepository, invoiceRepository, paymentRepository, historyRepository } from './repositories.js'

const json = (response, status, body) => { response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); response.end(JSON.stringify(body)) }
const readBody = async (request) => {
  let data = ''
  for await (const chunk of request) {
    data += chunk
    if (data.length > 1_000_000) throw Object.assign(new Error('Request body too large'), { statusCode: 413 })
  }
  try { return data ? JSON.parse(data) : {} } catch { throw Object.assign(new Error('Invalid JSON body'), { statusCode: 400 }) }
}

export const createApp = ({ corsOrigin = ['http://localhost:5173'], checkDatabase = async () => true, pool, tokenSecret, tokenLifetimeSeconds = 28800 } = {}) => createServer(async (request, response) => {
  const origin = request.headers.origin
  const allowedOrigins = Array.isArray(corsOrigin) ? corsOrigin : [corsOrigin]
  if (origin && allowedOrigins.includes(origin)) response.setHeader('Access-Control-Allow-Origin', origin)
  response.setHeader('Vary', 'Origin')
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key')

  if (request.method === 'OPTIONS') {
    response.writeHead(204)
    response.end()
    return
  }

  if (request.method === 'POST' && request.url === '/auth/login') {
    try {
      const body = await readBody(request)
      if (typeof body.username !== 'string' || !body.username.trim() || typeof body.password !== 'string' || !body.password) return json(response, 400, { error: 'Username and password are required' })
      const [rows] = await pool.execute('SELECT id, username, password_hash, role FROM users WHERE username = ? AND active = TRUE LIMIT 1', [body.username.trim()])
      const user = rows[0]
      if (!user || !(await verifyPassword(body.password, user.password_hash))) return json(response, 401, { error: 'Invalid username or password' })
      const token = signToken(user, tokenSecret, tokenLifetimeSeconds)
      return json(response, 200, { token, expiresAt: new Date(Date.now() + tokenLifetimeSeconds * 1000).toISOString(), user: { id: user.id, username: user.username, role: user.role } })
    } catch (error) { return json(response, error.statusCode ?? 500, { error: error.statusCode ? error.message : 'Unable to authenticate' }) }
  }

  if (request.method === 'GET' && request.url === '/health') {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    response.end(JSON.stringify({ status: 'ok', service: 'spillbill-api' }))
    return
  }

  if (request.method === 'GET' && request.url === '/health/db') {
    try {
      const healthy = await checkDatabase()
      response.writeHead(healthy ? 200 : 503, { 'Content-Type': 'application/json; charset=utf-8' })
      response.end(JSON.stringify({ status: healthy ? 'ok' : 'error', database: healthy ? 'reachable' : 'unreachable' }))
    } catch {
      response.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' })
      response.end(JSON.stringify({ status: 'error', database: 'unreachable' }))
    }
    return
  }

  try {
    const claims = verifyToken(bearerToken(request.headers.authorization), tokenSecret)
    if (!claims) return json(response, 401, { error: 'Authentication required' })
    const [rows] = await pool.execute('SELECT id, username, role FROM users WHERE id = ? AND active = TRUE LIMIT 1', [claims.sub])
    if (!rows[0]) return json(response, 401, { error: 'Authentication required' })
    request.user = rows[0]
  } catch {
    return json(response, 500, { error: 'Unable to authorize request' })
  }

  if (request.method === 'GET' && request.url === '/auth/session') return json(response, 200, { user: request.user })
  const route = new URL(request.url, 'http://localhost')
  const match = /^\/(customers|products|sales-orders|invoices|payments|histories)(?:\/([0-9a-f-]{36}))?(?:\/(cancel|void|activate|deactivate))?$/.exec(route.pathname)
  if (match) {
    const [, entity, id, action] = match
    const repository = entity === 'customers' ? customerRepository : entity === 'products' ? productRepository : entity === 'sales-orders' ? salesOrderRepository : entity === 'invoices' ? invoiceRepository : entity === 'payments' ? paymentRepository : historyRepository
    const write = request.method !== 'GET'
    const allowedWriter = entity === 'invoices' || entity === 'payments' ? 'ACCOUNTING' : 'MARKETING'
    if (write && request.user.role !== allowedWriter) return json(response, 403, { error: 'Forbidden' })
    try {
      if (request.method === 'GET' && !id) return json(response, 200, await repository.list(pool))
      if (entity === 'sales-orders' && request.method === 'DELETE' && id && !action) { await repository.archive(pool, request.user.id, id); return json(response, 200, { archived: true }) }
      if (entity === 'sales-orders' && request.method === 'POST' && action === 'cancel' && id) { await repository.cancel(pool, request.user.id, id); return json(response, 200, { cancelled: true }) }
      if (entity === 'payments' && request.method === 'POST' && action === 'void' && id) { await repository.void(pool, request.user.id, id); return json(response, 200, { voided: true }) }
      if (entity === 'products' && request.method === 'POST' && (action === 'activate' || action === 'deactivate') && id) { await repository.setActive(pool, request.user.id, id, action === 'activate'); return json(response, 200, { active: action === 'activate' }) }
      if (entity === 'invoices' && request.method === 'POST' && !id) return json(response, 201, await repository.create(pool, request.user.id, await readBody(request)))
      if (entity === 'payments' && request.method === 'POST' && !id) return json(response, 201, await repository.create(pool, request.user.id, await readBody(request), request.headers['idempotency-key']))
      if (entity === 'invoices' && request.method === 'PATCH' && id) { await repository.updateDueDate(pool, request.user.id, id, await readBody(request)); return json(response, 200, { updated: true }) }
      if (entity === 'invoices' && request.method === 'DELETE' && id) { await repository.archive(pool, request.user.id, id); return json(response, 200, { archived: true }) }
      if (request.method === 'POST' && !id && !action) return json(response, 201, await repository.save(pool, request.user.id, await readBody(request)))
      if (request.method === 'PATCH' && id && !action) return json(response, 200, await repository.save(pool, request.user.id, await readBody(request), id))
      if (request.method === 'DELETE' && id) { await repository.archive(pool, request.user.id, id); return json(response, 200, { archived: true }) }
      return json(response, 405, { error: 'Method not allowed' })
    } catch (error) { return json(response, error.statusCode ?? (error.code === 'ER_DUP_ENTRY' ? 409 : 500), { error: error.statusCode || error.code === 'ER_DUP_ENTRY' ? error.message : 'Database operation failed' }) }
  }
  json(response, 404, { error: 'Not found' })
})
