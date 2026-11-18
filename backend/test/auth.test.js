import test from 'node:test'
import assert from 'node:assert/strict'
import { bearerToken, signToken, verifyToken } from '../src/auth.js'

const secret = 'a'.repeat(32)

test('signed bearer token identifies subject until expiry', () => {
  const token = signToken({ id: 'user-1' }, secret, 60, 1_000_000)
  assert.equal(verifyToken(token, secret, 1_000_000)?.sub, 'user-1')
  assert.equal(verifyToken(token, secret, 1_061_000), null)
  assert.equal(verifyToken(`${token}x`, secret, 1_000_000), null)
})

test('bearer parser rejects malformed authorization headers', () => {
  assert.equal(bearerToken('Bearer abc.def.signature'), 'abc.def.signature')
  assert.equal(bearerToken('Basic abc'), null)
  assert.equal(bearerToken('Bearer a b'), null)
})
