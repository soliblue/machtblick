import assert from 'node:assert/strict'
import test from 'node:test'
import { rosterGapEnd } from './rosterGapEnd.ts'

test('a mandate opened after the latest ballot suppresses roster-gap close-out', () => {
  assert.equal(rosterGapEnd(true, '2026-07-10', false, '2026-07-20'), undefined)
})

test('an old open mandate does not suppress roster-gap close-out', () => {
  assert.equal(rosterGapEnd(true, '2026-07-10', false, '2025-03-25'), '2026-07-10')
})
