import { createHmac, timingSafeEqual } from 'node:crypto'
import bcrypt from 'bcryptjs'

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
const signature = (content, secret) => createHmac('sha256', secret).update(content).digest('base64url')

export const verifyPassword = (password, hash) => bcrypt.compare(password, hash)

export const signToken = (user, secret, lifetimeSeconds = 28800, now = Date.now()) => {
  const payload = encode({ sub: user.id, exp: Math.floor(now / 1000) + lifetimeSeconds })
  const content = `v1.${payload}`
  return `${content}.${signature(content, secret)}`
}

export const verifyToken = (token, secret, now = Date.now()) => {
  if (typeof token !== 'string') return null
  const [version, payload, supplied, extra] = token.split('.')
  if (version !== 'v1' || !payload || !supplied || extra) return null
  const content = `${version}.${payload}`
  const expected = Buffer.from(signature(content, secret))
  const actual = Buffer.from(supplied)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return typeof claims.sub === 'string' && Number.isInteger(claims.exp) && claims.exp > Math.floor(now / 1000) ? claims : null
  } catch { return null }
}

export const bearerToken = (header) => {
  const match = /^Bearer ([A-Za-z0-9_.-]+)$/.exec(header ?? '')
  return match?.[1] ?? null
}
