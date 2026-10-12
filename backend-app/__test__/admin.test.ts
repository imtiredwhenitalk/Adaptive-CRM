import assert from 'node:assert/strict'
import test from 'node:test'
import { can } from '../modules/admin/admin.js'

test('members cannot manage users', () => assert.equal(can('member', 'manageUsers'), false))