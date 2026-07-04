import { useMemo } from 'react'
import type { VoteListItem } from '@/server/votes'

export type VoteDayGroup = { date: string; votes: VoteListItem[] }

export function useVoteDayGroups(votes: VoteListItem[]) {
  return useMemo(() => {
    const groups: VoteDayGroup[] = []
    for (const v of votes) {
      const last = groups[groups.length - 1]
      if (last && last.date === v.date) last.votes.push(v)
      else groups.push({ date: v.date, votes: [v] })
    }
    return groups
  }, [votes])
}
