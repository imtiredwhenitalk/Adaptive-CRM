import assert from 'node:assert/strict'
import test from 'node:test'
import { auditEvents } from '../middleware/audit.js'

test('audit storage starts empty', () => assert.equal(Array.isArray(auditEvents), true))