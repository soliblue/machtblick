export type PartyMajority = 'ja' | 'nein' | 'enthalten'

export function majorityChoice(s: { position: 'yes' | 'no' | 'abstain' | 'mixed' }): PartyMajority | null {
  return s.position === 'yes' ? 'ja' : s.position === 'no' ? 'nein' : s.position === 'abstain' ? 'enthalten' : null
}
