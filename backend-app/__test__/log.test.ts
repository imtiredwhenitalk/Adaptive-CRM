import assert from 'node:assert/strict'
import test from 'node:test'
import { BotLogger } from '../bots/automation/bot-logger.js'

test('bot logger keeps signal history', () => {
  const logger = new BotLogger()
  logger.record({ kind: 'task', title: 'Test', description: 'Test', priority: 'low' })
  assert.equal(logger.list().length, 1)
})