import assert from 'node:assert/strict'
import test from 'node:test'
import { assertCompleteCurrentMandates, EXPECTED_CURRENT_MANDATES } from './currentMandateInvariant.ts'

function fixture() {
  const awMandates = Array.from({ length: EXPECTED_CURRENT_MANDATES }, (_, index) => ({
    mandateId: index + 1,
    politicianId: index + 1,
    politicianLabel: `Member ${index + 1}`,
    currentFraction: 'SPD',
    currentValidFrom: null,
    mandateValidFrom: '2025-03-25',
  }))
  const currentMandates = awMandates.map((mandate) => ({
    memberId: `member-${mandate.mandateId}`,
    party: mandate.currentFraction,
    factionValidFrom: mandate.currentValidFrom,
    mandateValidFrom: mandate.mandateValidFrom,
  }))
  return { awMandates, currentMandates }
}

test('a complete current AW roster passes', () => {
  const { awMandates, currentMandates } = fixture()
  assert.doesNotThrow(() => assertCompleteCurrentMandates(awMandates, currentMandates, []))
})

test('a partial, unmatched, duplicate, or partyless roster fails closed', () => {
  const partial = fixture()
  assert.throws(() => assertCompleteCurrentMandates(partial.awMandates.slice(1), partial.currentMandates.slice(1), []), /expected 630 current AW mandates/)
  const unmatched = fixture()
  assert.throws(() => assertCompleteCurrentMandates(unmatched.awMandates, unmatched.currentMandates, ['Missing Member']), /unmatched current AW mandates/)
  const duplicate = fixture()
  duplicate.currentMandates[1].memberId = duplicate.currentMandates[0].memberId
  assert.throws(() => assertCompleteCurrentMandates(duplicate.awMandates, duplicate.currentMandates, []), /unique canonical members/)
  const partyless = fixture()
  partyless.currentMandates[0].party = ''
  assert.throws(() => assertCompleteCurrentMandates(partyless.awMandates, partyless.currentMandates, []), /empty current AW party/)
})
