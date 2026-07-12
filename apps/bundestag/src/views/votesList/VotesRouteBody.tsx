import { useLoaderData, useNavigate, useSearch } from '@tanstack/react-router'
import { VotesList } from './VotesList'
import { useVoteListFilters } from '@/hooks/useVoteListFilters'
import { useVoteDayGroups } from '@/hooks/useVoteDayGroups'
import { useVoteFlags } from '@/hooks/useVoteFlags'

type Props = { from: '/votes/' | '/en/votes/' }

export function VotesRouteBody({ from }: Props) {
  const votes = useLoaderData({ from })
  const { party, type, result, topic, q, flag } = useSearch({ from })
  const navigate = useNavigate({ from })
  const { savedIds, seenIds } = useVoteFlags()
  const proposingParty = party ?? null
  const voteType = type ?? null
  const resultValue = result ?? null
  const topicValue = topic ?? null
  const query = q ?? ''
  const flagFilter = flag ?? 'all'
  const { filtered, availableParties, availableTopics } = useVoteListFilters(votes, proposingParty, voteType, resultValue, topicValue, query, flagFilter, savedIds, seenIds)
  const groups = useVoteDayGroups(filtered)
  return (
    <VotesList
      groups={groups}
      proposingParty={proposingParty}
      onProposingPartyChange={(v) => navigate({ search: (s) => ({ ...s, party: v ?? undefined }) })}
      availableParties={availableParties}
      voteType={voteType}
      onVoteTypeChange={(v) => navigate({ search: (s) => ({ ...s, type: v ?? undefined }) })}
      result={resultValue}
      onResultChange={(v) => navigate({ search: (s) => ({ ...s, result: v ?? undefined }) })}
      topic={topicValue}
      onTopicChange={(v) => navigate({ search: (s) => ({ ...s, topic: v ?? undefined }) })}
      availableTopics={availableTopics}
      flagFilter={flagFilter}
      onFlagFilterChange={(v) => navigate({ search: (s) => ({ ...s, flag: v === 'all' ? undefined : v }) })}
    />
  )
}
