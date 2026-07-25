import assert from 'node:assert/strict'
import test from 'node:test'
import { buildDipMemberResolver } from './dipMemberResolver.ts'

const members = [
  {
    id: 'zerbin-prof-dr-daniel',
    name: 'Prof. Dr. Daniel Zerbin',
    firstName: 'Prof. Dr. Daniel',
    lastName: 'Zerbin',
    dipPersonId: null,
  },
  {
    id: 'schmidt-jan-wenzel',
    name: 'Jan Wenzel Schmidt',
    firstName: 'Jan Wenzel',
    lastName: 'Schmidt',
    dipPersonId: 7406,
  },
]

test('resolves new and aliased DIP person IDs from activity titles', () => {
  const resolve = buildDipMemberResolver(members)
  assert.equal(resolve(8031, 'Dr. Daniel Zerbin, MdB, AfD'), 'zerbin-prof-dr-daniel')
  assert.equal(resolve(8220, 'Jan Wenzel Schmidt, MdB, fraktionslos'), 'schmidt-jan-wenzel')
  assert.equal(resolve(7406), 'schmidt-jan-wenzel')
})

test('does not guess when a normalized member name is ambiguous', () => {
  const resolve = buildDipMemberResolver([
    ...members,
    { ...members[1], id: 'schmidt-jan-wenzel-2', dipPersonId: null },
  ])
  assert.equal(resolve(8220, 'Jan Wenzel Schmidt, MdB, fraktionslos'), null)
})
