import assert from 'node:assert/strict'
import test from 'node:test'
import { userInitials } from '../modules/users/user.js'

test('user initials use the first two name parts', () => assert.equal(userInitials('Олена Коваль'), 'ОК'))