import assert from 'node:assert/strict'
import test from 'node:test'
import { buildAffiliationRows, latestEndByMember, missingOpenMandates } from './affiliationRows.ts'

test('current roster adds a non-voter and closes the departed member', () => {
  const rows = buildAffiliationRows(
    [
      { memberId: 'junge-frank', party: 'SPD', firstDate: '2025-03-25', lastDate: '2026-07-10' },
      { memberId: 'hess-martin', party: 'AfD', firstDate: '2025-03-25', lastDate: '2026-07-10' },
    ],
    [
      { memberId: 'hess-martin', party: 'AfD', factionValidFrom: null, mandateValidFrom: '2025-03-25' },
      { memberId: 'zschau-katrin', party: 'SPD', factionValidFrom: null, mandateValidFrom: '2026-07-20' },
    ],
    new Map([['junge-frank', '2026-07-19']]),
    '2025-03-25',
    21,
  )
  assert.deepEqual(rows, [
    { memberId: 'junge-frank', party: 'SPD', validFrom: '2025-03-25', validTo: '2026-07-19', termId: 21 },
    { memberId: 'hess-martin', party: 'AfD', validFrom: '2025-03-25', validTo: null, termId: 21 },
    { memberId: 'zschau-katrin', party: 'SPD', validFrom: '2026-07-20', validTo: null, termId: 21 },
  ])
})

test('a current faction change after the latest ballot creates a new run', () => {
  const rows = buildAffiliationRows(
    [{ memberId: 'switcher', party: 'AfD', firstDate: '2025-03-25', lastDate: '2026-07-10' }],
    [{ memberId: 'switcher', party: 'fraktionslos', factionValidFrom: '2026-07-20', mandateValidFrom: '2025-03-25' }],
    new Map(),
    '2025-03-25',
    21,
  )
  assert.deepEqual(rows, [
    { memberId: 'switcher', party: 'AfD', validFrom: '2025-03-25', validTo: '2026-07-19', termId: 21 },
    { memberId: 'switcher', party: 'fraktionslos', validFrom: '2026-07-20', validTo: null, termId: 21 },
  ])
})

test('a stale AW faction date cannot override newer ballot evidence', () => {
  const rows = buildAffiliationRows(
    [{ memberId: 'member', party: 'SPD', firstDate: '2025-03-25', lastDate: '2026-07-10' }],
    [{ memberId: 'member', party: 'AfD', factionValidFrom: '2026-06-01', mandateValidFrom: '2025-03-25' }],
    new Map(),
    '2025-03-25',
    21,
  )
  assert.deepEqual(rows, [{ memberId: 'member', party: 'SPD', validFrom: '2025-03-25', validTo: null, termId: 21 }])
})

test('re-entry still fetches an older missing mandate and keeps the latest end', () => {
  const mandates = [
    { memberId: 'member', mandateId: 1, validTo: null },
    { memberId: 'member', mandateId: 2, validTo: null },
    { memberId: 'member', mandateId: 3, validTo: '2026-03-01' },
  ]
  assert.deepEqual(missingOpenMandates(mandates, new Set([2])), [mandates[0]])
  assert.deepEqual([...latestEndByMember(mandates, new Map([[1, '2026-04-01']]))], [['member', '2026-04-01']])
})

test('same-party re-entry stays split after post-re-entry ballots', () => {
  const rows = buildAffiliationRows(
    [{ memberId: 'member', party: 'SPD', firstDate: '2025-03-25', lastDate: '2026-07-30' }],
    [{ memberId: 'member', party: 'SPD', factionValidFrom: null, mandateValidFrom: '2026-07-20' }],
    new Map([['member', '2026-07-19']]),
    '2025-03-25',
    21,
  )
  assert.deepEqual(rows, [
    { memberId: 'member', party: 'SPD', validFrom: '2025-03-25', validTo: '2026-07-19', termId: 21 },
    { memberId: 'member', party: 'SPD', validFrom: '2026-07-20', validTo: null, termId: 21 },
  ])
})

test('an older mandate end cannot truncate a later ballot run', () => {
  const rows = buildAffiliationRows(
    [{ memberId: 'member', party: 'AfD', firstDate: '2025-03-25', lastDate: '2026-07-10' }],
    [{ memberId: 'member', party: 'fraktionslos', factionValidFrom: '2026-07-20', mandateValidFrom: '2025-03-25' }],
    new Map([['member', '2026-05-31']]),
    '2025-03-25',
    21,
  )
  assert.deepEqual(rows, [
    { memberId: 'member', party: 'AfD', validFrom: '2025-03-25', validTo: '2026-07-19', termId: 21 },
    { memberId: 'member', party: 'fraktionslos', validFrom: '2026-07-20', validTo: null, termId: 21 },
  ])
})

test('a stale faction boundary cannot invert an A B A history', () => {
  const rows = buildAffiliationRows(
    [
      { memberId: 'member', party: 'A', firstDate: '2025-03-25', lastDate: '2025-04-10' },
      { memberId: 'member', party: 'B', firstDate: '2025-05-01', lastDate: '2025-06-10' },
      { memberId: 'member', party: 'A', firstDate: '2025-07-25', lastDate: '2025-08-01' },
    ],
    [{ memberId: 'member', party: 'A', factionValidFrom: '2025-04-20', mandateValidFrom: '2025-03-25' }],
    new Map(),
    '2025-03-25',
    21,
  )
  assert.deepEqual(rows, [
    { memberId: 'member', party: 'A', validFrom: '2025-03-25', validTo: '2025-04-30', termId: 21 },
    { memberId: 'member', party: 'B', validFrom: '2025-05-01', validTo: '2025-07-24', termId: 21 },
    { memberId: 'member', party: 'A', validFrom: '2025-07-25', validTo: null, termId: 21 },
  ])
})

test('faction and mandate dates keep their separate meanings', () => {
  const rows = buildAffiliationRows(
    [],
    [{ memberId: 'member', party: 'SPD', factionValidFrom: '2026-08-01', mandateValidFrom: '2026-07-20' }],
    new Map(),
    '2025-03-25',
    21,
  )
  assert.deepEqual(rows, [{ memberId: 'member', party: 'SPD', validFrom: '2026-08-01', validTo: null, termId: 21 }])
})

test('re-entry does not pull a later current faction back to mandate start', () => {
  const rows = buildAffiliationRows(
    [
      { memberId: 'member', party: 'A', firstDate: '2025-03-25', lastDate: '2026-04-10' },
      { memberId: 'member', party: 'B', firstDate: '2026-05-01', lastDate: '2026-06-10' },
      { memberId: 'member', party: 'A', firstDate: '2026-07-20', lastDate: '2026-08-01' },
    ],
    [{ memberId: 'member', party: 'A', factionValidFrom: '2026-07-10', mandateValidFrom: '2026-07-01' }],
    new Map([['member', '2026-06-30']]),
    '2025-03-25',
    21,
  )
  assert.deepEqual(rows, [
    { memberId: 'member', party: 'A', validFrom: '2025-03-25', validTo: '2026-04-30', termId: 21 },
    { memberId: 'member', party: 'B', validFrom: '2026-05-01', validTo: '2026-06-30', termId: 21 },
    { memberId: 'member', party: 'A', validFrom: '2026-07-10', validTo: null, termId: 21 },
  ])
})
