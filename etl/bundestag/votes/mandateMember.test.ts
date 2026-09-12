import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveMandateMember } from './mandateMember.ts'

test('prefers an existing AW politician mapping and preserves its canonical Bundestag id', () => {
  let nameFallbackCalled = false
  assert.deepEqual(resolveMandateMember(
    182827,
    '00002832',
    new Map([[182827, 'zobel-vanessa']]),
    new Map([['00002832', 'zobel-vanessa-kim']]),
    new Map([['zobel-vanessa', '11005620']]),
    () => {
      nameFallbackCalled = true
      return 'zobel-vanessa-kim'
    },
  ), { memberId: 'zobel-vanessa', btMdbId: '11005620' })
  assert.equal(nameFallbackCalled, false)
})
