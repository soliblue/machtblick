import type { CurrentAwMandate } from './affiliationRows.ts'
import type { AwMandate } from './awFractions.ts'

export const EXPECTED_CURRENT_MANDATES = 630

export function assertCompleteCurrentMandates(awMandates: AwMandate[], currentMandates: CurrentAwMandate[], unmatched: string[]) {
  if (awMandates.length !== EXPECTED_CURRENT_MANDATES) throw new Error(`expected ${EXPECTED_CURRENT_MANDATES} current AW mandates, got ${awMandates.length}`)
  if (unmatched.length) throw new Error(`unmatched current AW mandates: ${unmatched.join(', ')}`)
  if (currentMandates.length !== EXPECTED_CURRENT_MANDATES) throw new Error(`expected ${EXPECTED_CURRENT_MANDATES} mapped current AW mandates, got ${currentMandates.length}`)
  if (new Set(currentMandates.map((mandate) => mandate.memberId)).size !== EXPECTED_CURRENT_MANDATES) throw new Error('current AW mandates do not map to unique canonical members')
  const emptyParty = currentMandates.find((mandate) => !mandate.party)
  if (emptyParty) throw new Error(`empty current AW party for ${emptyParty.memberId}`)
}
