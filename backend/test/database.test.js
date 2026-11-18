import test from 'node:test'
import assert from 'node:assert/strict'
import { createDatabasePoolOptions } from '../src/database.js'

test('createDatabasePoolOptions maps app config to MySQL options', () => {
  assert.deepEqual(createDatabasePoolOptions({
    host: '127.0.0.1',
    port: 13306,
    name: 'twizzi',
    user: 'spillbill_dev',
    password: 'secret',
    connectionLimit: 5,
    ssl: false,
  }), {
    host: '127.0.0.1',
    port: 13306,
    database: 'twizzi',
    user: 'spillbill_dev',
    password: 'secret',
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 5,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: undefined,
  })
})
