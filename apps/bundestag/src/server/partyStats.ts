export function cohesion(s: { yes: number | null; no: number | null; abstain: number | null }) {
  const decided = (s.yes ?? 0) + (s.no ?? 0) + (s.abstain ?? 0)
  return decided ? Math.max(s.yes ?? 0, s.no ?? 0, s.abstain ?? 0) / decided : 0
}

export function attendance(s: { members: number | null; absent: number | null }) {
  return s.members ? 1 - (s.absent ?? 0) / s.members : 0
}
