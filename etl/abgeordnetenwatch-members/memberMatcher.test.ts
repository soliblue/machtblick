import assert from 'node:assert/strict'
import test from 'node:test'
import { buildMemberMatcher } from './memberMatcher.ts'

const members = [
  { id: 'hess-martin', first: 'Martin', last: 'Hess', btMdbId: '11004749' },
  { id: 'hess-nicole', first: 'Nicole', last: 'Hess', btMdbId: '11005483' },
  { id: 'zschau-katrin', first: 'Katrin', last: 'Zschau', btMdbId: '00002588' },
  { id: 'alhamwi-alaa', first: 'Dr. Alaa', last: 'Alhamwi', btMdbId: '11005000' },
  { id: 'muster-anna-one', first: 'Anna', last: 'Muster', btMdbId: '11006001' },
  { id: 'muster-anna-two', first: 'Anna', last: 'Muster', btMdbId: '11006002' },
]

test('mandate politician ids disambiguate duplicated profile ids', () => {
  const match = buildMemberMatcher(members, new Map([[145840, 'hess-martin'], [179923, 'hess-nicole']]), new Set(['hess-martin', 'hess-nicole']))
  assert.equal(match({ first_name: 'Martin', last_name: 'Hess', ext_id_bundestagsverwaltung: '11004749' }, 145840).member?.id, 'hess-martin')
  assert.equal(match({ first_name: 'Nicole', last_name: 'Hess', ext_id_bundestagsverwaltung: '11004749' }, 179923).member?.id, 'hess-nicole')
})

test('a unique name outranks a conflicting profile external id', () => {
  const match = buildMemberMatcher(members, new Map(), new Set(['hess-martin', 'hess-nicole']))
  assert.equal(match({ first_name: 'Nicole', last_name: 'Hess', ext_id_bundestagsverwaltung: '11004749' }, 179923).member?.id, 'hess-nicole')
})

test('new mandate holders fall back to their unique name', () => {
  const match = buildMemberMatcher(members, new Map())
  assert.equal(match({ first_name: 'Katrin', last_name: 'Zschau', ext_id_bundestagsverwaltung: '11005268' }, 175453).member?.id, 'zschau-katrin')
})

test('titled local given names still match the profile name', () => {
  const match = buildMemberMatcher(members, new Map())
  assert.equal(match({ first_name: 'Alaa', last_name: 'Alhamwi', ext_id_bundestagsverwaltung: null }, 180000).member?.id, 'alhamwi-alaa')
})

test('a valid profile id remains authoritative when the name is ambiguous', () => {
  const match = buildMemberMatcher(members, new Map(), new Set(['muster-anna-one', 'muster-anna-two']))
  assert.equal(match({ first_name: 'Anna', last_name: 'Muster', ext_id_bundestagsverwaltung: '11006002' }, 180001).member?.id, 'muster-anna-two')
})

test('an active canonical member outranks an inactive mandate placeholder', () => {
  const match = buildMemberMatcher([
    { id: 'kokturk-cansin', first: 'Cansin', last: 'Köktürk', btMdbId: '11005505' },
    { id: 'kokturk-cans-n', first: 'Cansın', last: 'Köktürk', btMdbId: '00002716' },
    { id: 'zobel-vanessa', first: 'Vanessa', last: 'Zobel', btMdbId: '11005620' },
    { id: 'zobel-vanessa-kim', first: 'Vanessa-Kim', last: 'Zobel', btMdbId: '00002832' },
  ], new Map([[184033, 'kokturk-cans-n'], [182827, 'zobel-vanessa-kim']]), new Set(['kokturk-cansin', 'zobel-vanessa']))
  assert.equal(match({ first_name: 'Cansın', last_name: 'Köktürk', ext_id_bundestagsverwaltung: '11005505' }, 184033).member?.id, 'kokturk-cansin')
  assert.equal(match({ first_name: 'Vanessa-Kim', last_name: 'Zobel', ext_id_bundestagsverwaltung: '11005620' }, 182827).member?.id, 'zobel-vanessa')
})

test('an inactive direct mandate mapping outranks an unrelated active external id', () => {
  const match = buildMemberMatcher(members, new Map([[175453, 'zschau-katrin']]), new Set(['hess-martin']))
  assert.equal(match({ first_name: 'Katrin', last_name: 'Zschau', ext_id_bundestagsverwaltung: '11004749' }, 175453).member?.id, 'zschau-katrin')
})
