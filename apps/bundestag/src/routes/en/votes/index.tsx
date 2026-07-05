import { createFileRoute, stripSearchParams, useNavigate } from '@tanstack/react-router'
import { listVotes } from '@/server/votes'
import { VotesList } from '@/views/votesList/VotesList'
import { useVoteListFilters, type VoteTypeFilter, type VoteResultFilter } from '@/hooks/useVoteListFilters'
import { useVoteDayGroups } from '@/hooks/useVoteDayGroups'
import { seoMeta, canonicalLink } from '@/lib/seo'

const VOTE_TYPES: VoteTypeFilter[] = ['namentlich', 'handzeichen', 'hammelsprung']
const isVoteType = (v: unknown): v is VoteTypeFilter => typeof v === 'string' && (VOTE_TYPES as string[]).includes(v)
const isResult = (v: unknown): v is VoteResultFilter => v === 'angenommen' || v === 'abgelehnt'

type Search = { party?: string; type?: VoteTypeFilter; result?: VoteResultFilter; topic?: string; q?: string }

export const Route = createFileRoute('/en/votes/')({
  component: VotesRoute,
  loader: () => listVotes({ data: 'en' }),
  head: () => ({
    meta: seoMeta({
      title: 'Bundestag votes',
      description: 'All votes in the German Bundestag: results, majorities, defectors, and how each parliamentary group voted.',
      canonical: '/en/votes',
    }),
    links: canonicalLink('/en/votes'),
  }),
  validateSearch: (search: Record<string, unknown>): Search => ({
    party: typeof search.party === 'string' ? search.party : undefined,
    type: isVoteType(search.type) ? search.type : 'namentlich',
    result: isResult(search.result) ? search.result : undefined,
    topic: typeof search.topic === 'string' ? search.topic : undefined,
    q: typeof search.q === 'string' ? search.q : undefined,
  }),
  search: { middlewares: [stripSearchParams({ type: 'namentlich' as VoteTypeFilter })] },
})

function VotesRoute() {
  const votes = Route.useLoaderData()
  const { party, type, result, topic, q } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const proposingParty = party ?? null
  const voteType = type ?? null
  const resultValue = result ?? null
  const topicValue = topic ?? null
  const query = q ?? ''
  const { filtered, availableParties, availableTopics } = useVoteListFilters(votes, proposingParty, voteType, resultValue, topicValue, query)
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
    />
  )
}
