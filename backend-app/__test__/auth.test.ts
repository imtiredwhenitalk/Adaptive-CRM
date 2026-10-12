import assert from 'node:assert/strict'
import test from 'node:test'
import { createSessionToken, sessionExpiresAt } from '../infrastructure/auth/auth.js'

test('session tokens are random and expire in the future', () => {
  assert.notEqual(createSessionToken(), createSessionToken())
  assert.ok(sessionExpiresAt().getTime() > Date.now())
})