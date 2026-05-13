import { useMemo } from 'react'
import type { VoteListItem } from '@/server/votes'

export type VoteTypeFilter = 'namentlich' | 'handzeichen' | 'hammelsprung'
export type VoteResultFilter = 'angenommen' | 'abgelehnt'

export function useVoteListFilters(
  votes: VoteListItem[],
  proposingParty: string | null,
  voteType: VoteTypeFilter | null,
  result: VoteResultFilter | null,
  topic: string | null,
  query: string = '',
) {
  const availableParties = useMemo(() => {
    const set = new Set<string>()
    for (const v of votes) if (v.proposingParty) set.add(v.proposingParty)
    return Array.from(set).sort()
  }, [votes])
  const availableTopics = useMemo(() => {
    const counts = new Map<string, number>()
    for (const v of votes) if (v.topic) counts.set(v.topic, (counts.get(v.topic) ?? 0) + 1)
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'de'))
      .map(([t]) => t)
  }, [votes])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return votes.filter((v) => {
      if (q && !(v.cleanTitle ?? v.title).toLowerCase().includes(q) && !v.title.toLowerCase().includes(q)) return false
      if (proposingParty && v.proposingParty !== proposingParty) return false
      if (voteType && v.voteType !== voteType) return false
      if (result && v.result !== result) return false
      if (topic && v.topic !== topic) return false
      return true
    })
  }, [votes, proposingParty, voteType, result, topic, query])
  return { filtered, availableParties, availableTopics }
}
