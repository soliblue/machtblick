import { useMemo } from 'react'
import type { VoteListItem } from '@/server/votes'
import type { VoteFlagFilter } from '@/hooks/useVoteFlags'

export type VoteTypeFilter = VoteListItem['voteType']
export type VoteResultFilter = VoteListItem['result']

const EMPTY_IDS = new Set<string>()

export function useVoteListFilters(
  votes: VoteListItem[],
  proposingParty: string | null,
  voteType: VoteTypeFilter | null,
  result: VoteResultFilter | null,
  topic: string | null,
  query: string = '',
  flagFilter: VoteFlagFilter = 'all',
  savedIds: ReadonlySet<string> = EMPTY_IDS,
  seenIds: ReadonlySet<string> = EMPTY_IDS,
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
      if (q && !v.cleanTitle.toLowerCase().includes(q) && !v.title.toLowerCase().includes(q)) return false
      if (proposingParty && v.proposingParty !== proposingParty) return false
      if (voteType && v.voteType !== voteType) return false
      if (result && v.result !== result) return false
      if (topic && v.topic !== topic) return false
      if (flagFilter === 'saved' && !savedIds.has(v.id)) return false
      if (flagFilter === 'seen' && !seenIds.has(v.id)) return false
      if (flagFilter === 'unseen' && seenIds.has(v.id)) return false
      return true
    })
  }, [votes, proposingParty, voteType, result, topic, query, flagFilter, savedIds, seenIds])
  return { filtered, availableParties, availableTopics }
}
