import assert from 'node:assert/strict'
import test from 'node:test'
import { awMemberDuplicateMerges } from './awMemberDuplicates.ts'

test('merges members sharing an AW politician id into the validated mapping', () => {
  assert.deepEqual(awMemberDuplicateMerges([
    { memberId: 'zobel-vanessa', awPoliticianId: 182827 },
    { memberId: 'zobel-vanessa-kim', awPoliticianId: 182827 },
    { memberId: 'kokturk-cansin', awPoliticianId: 184033 },
    { memberId: 'kokturk-cans-n', awPoliticianId: 184033 },
  ], new Map([
    [182827, 'zobel-vanessa'],
    [184033, 'kokturk-cansin'],
  ]), () => 0, (id) => id), new Map([
    ['zobel-vanessa-kim', 'zobel-vanessa'],
    ['kokturk-cans-n', 'kokturk-cansin'],
  ]))
})

test('uses current-term ballots instead of historical ballot volume without a validated mapping', () => {
  const currentTermBallots = new Map([
    ['current-member', 4],
    ['historical-shadow', 0],
  ])
  assert.deepEqual(awMemberDuplicateMerges([
    { memberId: 'historical-shadow', awPoliticianId: 123 },
    { memberId: 'current-member', awPoliticianId: 123 },
  ], new Map(), (id) => currentTermBallots.get(id) ?? 0, (id) => id), new Map([
    ['historical-shadow', 'current-member'],
  ]))
})
