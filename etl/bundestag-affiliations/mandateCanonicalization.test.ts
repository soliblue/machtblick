import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalizeLocalMandates, type LocalAwMandate } from './mandateCanonicalization.ts'

function row(values: Partial<LocalAwMandate> & Pick<LocalAwMandate, 'rowId' | 'memberId'>): LocalAwMandate {
  return {
    btMdbId: null,
    politicianId: null,
    mandateId: null,
    mandateType: null,
    listState: null,
    constituencyNumber: null,
    constituencyName: null,
    validFrom: '2025-03-25',
    validTo: null,
    ...values,
  }
}

test('placeholder AW mandates merge into canonical voter mandates', () => {
  const result = canonicalizeLocalMandates([
    row({ rowId: 1, memberId: 'kokturk-cansin', btMdbId: '11005505', mandateType: 'liste' }),
    row({ rowId: 2, memberId: 'kokturk-cans-n', mandateId: 68680, politicianId: 184033, btMdbId: '00002716', mandateType: 'liste' }),
    row({ rowId: 3, memberId: 'zobel-vanessa', btMdbId: '11005620', mandateType: 'direkt' }),
    row({ rowId: 4, memberId: 'zobel-vanessa-kim', mandateId: 69000, politicianId: 182827, btMdbId: '00002832', mandateType: 'direkt' }),
  ], [
    { memberId: 'kokturk-cansin', btMdbId: '11005505', politicianId: 184033, mandateId: 68680 },
    { memberId: 'zobel-vanessa', btMdbId: '11005620', politicianId: 182827, mandateId: 69000 },
  ])
  assert.deepEqual(result.rows.map(({ rowId, memberId, btMdbId, politicianId, mandateId }) => ({ rowId, memberId, btMdbId, politicianId, mandateId })), [
    { rowId: 1, memberId: 'kokturk-cansin', btMdbId: '11005505', politicianId: 184033, mandateId: 68680 },
    { rowId: 3, memberId: 'zobel-vanessa', btMdbId: '11005620', politicianId: 182827, mandateId: 69000 },
  ])
  assert.deepEqual(result.changes.map(({ sourceRowId, targetRowId }) => ({ sourceRowId, targetRowId })), [
    { sourceRowId: 2, targetRowId: 1 },
    { sourceRowId: 4, targetRowId: 3 },
  ])
})

test('conflicting canonical mandate claims fail before any write plan exists', () => {
  assert.throws(() => canonicalizeLocalMandates([
    row({ rowId: 1, memberId: 'canonical', mandateId: 999, politicianId: 123 }),
    row({ rowId: 2, memberId: 'placeholder', mandateId: 68680, politicianId: 184033 }),
  ], [
    { memberId: 'canonical', btMdbId: null, politicianId: 184033, mandateId: 68680 },
  ]), /conflict/)
})
