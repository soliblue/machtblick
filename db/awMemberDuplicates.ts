export function awMemberDuplicateMerges(
  rows: Array<{ memberId: string; awPoliticianId: number }>,
  preferredMemberIdByAwPoliticianId: Map<number, string>,
  termBallots: (memberId: string) => number,
  resolve: (memberId: string) => string,
) {
  const byAwPoliticianId = new Map<number, Set<string>>()
  for (const row of rows) {
    byAwPoliticianId.set(row.awPoliticianId, (byAwPoliticianId.get(row.awPoliticianId) ?? new Set()).add(resolve(row.memberId)))
  }
  const merges = new Map<string, string>()
  for (const [awPoliticianId, ids] of byAwPoliticianId) {
    if (ids.size < 2) continue
    const preferred = resolve(preferredMemberIdByAwPoliticianId.get(awPoliticianId) ?? '')
    const maxBallots = Math.max(...[...ids].map(termBallots))
    const ballotCandidates = [...ids].filter((id) => termBallots(id) === maxBallots)
    const canonical = ids.has(preferred) ? preferred : ballotCandidates.length === 1 ? ballotCandidates[0] : null
    if (!canonical) continue
    for (const id of ids) if (id !== canonical) merges.set(id, canonical)
  }
  return merges
}
