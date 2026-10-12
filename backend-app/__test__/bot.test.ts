import assert from 'node:assert/strict'
import test from 'node:test'
import { createSignals } from '../src/automation.js'

test('automation creates a risk signal for stale deals', () => {
  const signals = createSignals([{ id: 1, userId: 'u', name: 'Deal', company: 'Co', value: 100, stage: 'Переговори', probability: 50, updatedAt: new Date(Date.now() - 8 * 86400000) }], [])
  assert.equal(signals[0].kind, 'deal_risk')
})