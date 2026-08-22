import assert from 'node:assert/strict'
import test from 'node:test'
import { buildAwMatcher } from './matchAwToMember.ts'

test('current vote identities outrank inactive mandate placeholders', () => {
  const match = buildAwMatcher(
    new Set(['kokturk-cansin', 'kokturk-cans-n', 'zobel-vanessa', 'zobel-vanessa-kim', 'zschau-katrin']),
    new Set(['kokturk-cansin', 'zobel-vanessa']),
  )
  assert.equal(match('Cansın Köktürk'), 'kokturk-cansin')
  assert.equal(match('Vanessa-Kim Zobel'), 'zobel-vanessa')
  assert.equal(match('Katrin Zschau'), 'zschau-katrin')
})

test('politician ids resolve labels that do not match local slugs', () => {
  const memberByAwPoliticianId = new Map([
    [175594, 'taher-saleh-kassem'],
    [145841, 'koegel-jurgen'],
    [28896, 'grassle-ingeborg'],
    [175486, 'alabali-radovan-reem'],
  ])
  const match = buildAwMatcher(new Set(memberByAwPoliticianId.values()), new Set(memberByAwPoliticianId.values()), memberByAwPoliticianId)
  assert.equal(match('Kassem Taher Saleh', 175594), 'taher-saleh-kassem')
  assert.equal(match('Jürgen Kögel', 145841), 'koegel-jurgen')
  assert.equal(match('Inge Gräßle', 28896), 'grassle-ingeborg')
  assert.equal(match('Reem Alabali Radovan', 175486), 'alabali-radovan-reem')
})
