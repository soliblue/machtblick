export function cohesion(s: { yes: number | null; no: number | null; abstain: number | null }) {
  const decided = (s.yes ?? 0) + (s.no ?? 0) + (s.abstain ?? 0)
  return decided ? Math.max(s.yes ?? 0, s.no ?? 0, s.abstain ?? 0) / decided : 0
}

export function attendance(s: { members: number | null; absent: number | null }) {
  return s.members ? 1 - (s.absent ?? 0) / s.members : 0
}

export function majorityPosition(s: { yes: number | null; no: number | null; abstain: number | null }): 'yes' | 'no' | null {
  const yes = s.yes ?? 0
  const no = s.no ?? 0
  const abstain = s.abstain ?? 0
  if (yes > no && yes > abstain) return 'yes'
  if (no > yes && no > abstain) return 'no'
  return null
}

export type PartyVote = 'yes' | 'no' | 'abstain' | 'split'

export function partyVote(s: { yes: number; no: number; abstain: number }): PartyVote {
  return s.yes > s.no && s.yes > s.abstain ? 'yes'
    : s.no > s.yes && s.no > s.abstain ? 'no'
    : s.abstain > s.yes && s.abstain > s.no ? 'abstain'
    : 'split'
}

export function successCounts(votes: Array<{ partyVote: PartyVote; result: 'angenommen' | 'abgelehnt' }>) {
  const decided = votes.filter((v) => v.partyVote === 'yes' || v.partyVote === 'no')
  return {
    decided: decided.length,
    matched: decided.filter((v) => v.result === (v.partyVote === 'yes' ? 'angenommen' : 'abgelehnt')).length,
  }
}

export type PartyAlignment = {
  party: string
  agreement: number
  sharedVotes: number
}

export function partyAlignments(positionsByVote: Map<string, Map<string, 'yes' | 'no' | null>>, party: string): PartyAlignment[] {
  const pairCounts = new Map<string, { matched: number; shared: number }>()
  for (const positions of positionsByVote.values()) {
    const selfPos = positions.get(party)
    if (!selfPos) continue
    for (const [other, otherPos] of positions) {
      if (other === party || other === 'fraktionslos' || !otherPos) continue
      const c = pairCounts.get(other) ?? { matched: 0, shared: 0 }
      c.shared += 1
      if (otherPos === selfPos) c.matched += 1
      pairCounts.set(other, c)
    }
  }
  return Array.from(pairCounts.entries())
    .filter(([, c]) => c.shared > 0)
    .map(([p, c]) => ({ party: p, agreement: c.matched / c.shared, sharedVotes: c.shared }))
    .sort((a, b) => b.agreement - a.agreement)
}
