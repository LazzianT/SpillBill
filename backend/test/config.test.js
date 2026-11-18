import test from 'node:test'
import assert from 'node:assert/strict'
import { loadConfig } from '../src/config.js'

test('loadConfig reads MySQL settings and requires a strong auth token secret', () => {
  const config = loadConfig({
    AUTH_TOKEN_SECRET: 'a'.repeat(32),
    DB_HOST: '127.0.0.1',
    DB_PORT: '13306',
    DB_NAME: 'twizzi',
    DB_USER: 'spillbill_dev',
    DB_PASSWORD: 'secret',
    PORT: '3000',
    CORS_ORIGIN: 'http://localhost:5173',
  })

  assert.deepEqual(config, {
    port: 3000,
    corsOrigin: ['http://localhost:5173'],
    tokenSecret: 'a'.repeat(32),
    tokenLifetimeSeconds: 28800,
    database: {
      host: '127.0.0.1',
      port: 13306,
      name: 'twizzi',
      user: 'spillbill_dev',
      password: 'secret',
      connectionLimit: 5,
      ssl: false,
    },
  })
})

test('loadConfig rejects missing or weak auth token secret', () => {
  const env = { DB_HOST: '127.0.0.1', DB_NAME: 'twizzi', DB_USER: 'spillbill_dev', DB_PASSWORD: 'secret' }
  assert.throws(() => loadConfig(env), /AUTH_TOKEN_SECRET is required/)
  assert.throws(() => loadConfig({ ...env, AUTH_TOKEN_SECRET: 'short' }), /at least 32 characters/)
})

test('loadConfig rejects missing database password', () => {
  assert.throws(
    () => loadConfig({ AUTH_TOKEN_SECRET: 'a'.repeat(32), DB_HOST: '127.0.0.1', DB_NAME: 'twizzi', DB_USER: 'spillbill_dev' }),
    /DB_PASSWORD is required/,
  )
})
