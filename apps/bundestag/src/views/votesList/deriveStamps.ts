import { hasPartyLine } from '@/lib/parties'
import type { StampVariant } from './Stamp'

export type StampPartySummary = {
  party: string
  members: number
  yes: number
  no: number
  abstain: number
  absent: number
}

export function deriveStamps(vote: {
  result: 'angenommen' | 'abgelehnt'
  yes: number
  no: number
  abstain: number
  totalMembers: number
  partySummaries: StampPartySummary[]
}): StampVariant[] {
  const stamps: StampVariant[] = [vote.result]
  const cast = vote.yes + vote.no
  if (cast > 0) {
    const margin = Math.abs(vote.yes - vote.no) / cast
    if (margin < 0.05) stamps.push('knapp')
    const top = Math.max(vote.yes, vote.no)
    if (vote.yes === cast || vote.no === cast) stamps.push('einstimmig')
    else if (top / cast >= 0.95) stamps.push('fast-einstimmig')
  }
  const lineParties = vote.partySummaries.filter((p) => hasPartyLine(p.party))
  const hasSplit = lineParties.some((p) => Math.min(p.yes, p.no) >= 1)
  if (hasSplit) stamps.push('abweichler')
  return stamps
}
