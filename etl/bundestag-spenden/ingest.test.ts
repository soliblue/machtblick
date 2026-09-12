import assert from 'node:assert/strict'
import test from 'node:test'
import { staleDonationIds, validateDonationRowCellCount } from './ingest.ts'

const source2025 = 'https://www.bundestag.de/parlament/praesidium/parteienfinanzierung/fundstellen50000/2025'
const source2026 = 'https://www.bundestag.de/parlament/praesidium/parteienfinanzierung/fundstellen50000/2026'
const sourceRows = [
  { id: 'current-2025', dateReceived: '2025-04-01', sourceUrl: source2025 },
  { id: 'current-2026', dateReceived: '2026-09-07', sourceUrl: source2026 },
]

test('removes superseded donations from the current official source scope', () => {
  assert.deepEqual(staleDonationIds([
    ...sourceRows,
    { id: 'old-cdu', dateReceived: '2026-09-02', sourceUrl: source2026 },
    { id: 'old-ssw', dateReceived: '2026-08-26', sourceUrl: source2026 },
  ], [
    ...sourceRows,
    { id: 'current-cdu', dateReceived: '2026-09-04', sourceUrl: source2026 },
    { id: 'current-ssw', dateReceived: '2026-09-01', sourceUrl: source2026 },
  ]), ['old-cdu', 'old-ssw'])
})

test('preserves older terms and rows owned by other sources', () => {
  assert.deepEqual(staleDonationIds(sourceRows, sourceRows), [])
  assert.deepEqual(staleDonationIds([
    ...sourceRows,
    { id: 'wp20', dateReceived: '2025-03-24', sourceUrl: source2025 },
    { id: 'other-source', dateReceived: '2026-09-02', sourceUrl: 'https://example.com/donations' },
  ], sourceRows), [])
})

test('rejects incomplete and duplicate source snapshots before deletion', () => {
  assert.throws(() => staleDonationIds(sourceRows, sourceRows.slice(1)), /yielded no rows/)
  assert.throws(() => staleDonationIds(sourceRows, [...sourceRows, sourceRows[1]]), /duplicate rows/)
})

test('allows a small correction but rejects a catastrophic per-source drop', () => {
  const existing2026 = Array.from({ length: 10 }, (_, index) => ({
    id: `existing-2026-${index}`,
    dateReceived: '2026-01-01',
    sourceUrl: source2026,
  }))
  assert.deepEqual(staleDonationIds(
    [sourceRows[0], ...existing2026],
    [sourceRows[0], ...existing2026.slice(0, 9)],
  ), ['existing-2026-9'])
  assert.throws(() => staleDonationIds(
    [sourceRows[0], ...existing2026],
    [sourceRows[0], existing2026[0]],
  ), /1 fetched, 10 existing/)
})

test('rejects malformed data rows while accepting header and five-cell rows', () => {
  assert.doesNotThrow(() => validateDonationRowCellCount(0))
  assert.doesNotThrow(() => validateDonationRowCellCount(5))
  assert.throws(() => validateDonationRowCellCount(4), /4 data cells, expected 5/)
  assert.throws(() => validateDonationRowCellCount(6), /6 data cells, expected 5/)
})
