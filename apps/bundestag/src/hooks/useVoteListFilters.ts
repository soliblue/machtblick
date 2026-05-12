import { useMemo } from 'react'
import type { VoteListItem } from '@/server/votes'

export type VoteTypeFilter = 'namentlich' | 'handzeichen' | 'hammelsprung'
export type VoteResultFilter = 'angenommen' | 'abgelehnt'

export function useVoteListFilters(
  votes: VoteListItem[],
  proposingParty: string | null,
  voteType: VoteTypeFilter | null,
  result: VoteResultFilter | null,
) {
  const availableParties = useMemo(() => {
    const set = new Set<string>()
    for (const v of votes) if (v.proposingParty) set.add(v.proposingParty)
    return Array.from(set).sort()
  }, [votes])
  const filtered = useMemo(() => {
    return votes.filter((v) => {
      if (proposingParty && v.proposingParty !== proposingParty) return false
      if (voteType && v.voteType !== voteType) return false
      if (result && v.result !== result) return false
      return true
    })
  }, [votes, proposingParty, voteType, result])
  return { filtered, availableParties }
}
