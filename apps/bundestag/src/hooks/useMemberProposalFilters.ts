import { useMemo } from 'react'
import type { MemberInitiativeRow } from '@/server/memberInitiatives'

export type MemberProposalVoteLinkFilter = 'with' | 'without'

type Filters = {
  statusFilter: string | null
  topicFilter: string | null
  voteLinkFilter: MemberProposalVoteLinkFilter | null
  query: string
}

export function useMemberProposalFilters(proposals: MemberInitiativeRow[], filters: Filters) {
  const statusOptions = useMemo(() => {
    const counts = new Map<string, number>()
    for (const row of proposals) if (row.beratungsstand) counts.set(row.beratungsstand, (counts.get(row.beratungsstand) ?? 0) + 1)
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([value]) => value)
  }, [proposals])
  const topicOptions = useMemo(() => {
    const counts = new Map<string, number>()
    for (const row of proposals) for (const topic of row.sachgebiet) counts.set(topic, (counts.get(topic) ?? 0) + 1)
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([value]) => value)
  }, [proposals])
  const trimmedQuery = filters.query.trim().toLowerCase()
  const filtered = useMemo(() => proposals.filter((row) => {
    const statusOk = filters.statusFilter ? row.beratungsstand === filters.statusFilter : true
    const topicOk = filters.topicFilter ? row.sachgebiet.includes(filters.topicFilter) : true
    const voteOk =
      filters.voteLinkFilter === 'with' ? row.linkedVotes.length > 0
      : filters.voteLinkFilter === 'without' ? row.linkedVotes.length === 0
      : true
    const queryOk = trimmedQuery ? row.title.toLowerCase().includes(trimmedQuery) : true
    return statusOk && topicOk && voteOk && queryOk
  }), [proposals, filters.statusFilter, filters.topicFilter, filters.voteLinkFilter, trimmedQuery])
  return { filtered, statusOptions, topicOptions }
}
