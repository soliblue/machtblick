import { createFileRoute, stripSearchParams, useNavigate } from '@tanstack/react-router'
import { listVotes } from '@/server/votes'
import { VotesList } from '@/views/votesList/VotesList'
import { useVoteListFilters, type VoteTypeFilter, type VoteResultFilter } from '@/hooks/useVoteListFilters'
import { useVoteDayGroups } from '@/hooks/useVoteDayGroups'
import { isVoteFlagFilter, useVoteFlags, type VoteFlagFilter } from '@/hooks/useVoteFlags'
import { seoMeta, canonicalLink, breadcrumbJsonLd } from '@/lib/seo'

const VOTE_TYPES: VoteTypeFilter[] = ['namentlich', 'handzeichen', 'hammelsprung']
const isVoteType = (v: unknown): v is VoteTypeFilter => typeof v === 'string' && (VOTE_TYPES as string[]).includes(v)
const isResult = (v: unknown): v is VoteResultFilter => v === 'angenommen' || v === 'abgelehnt'

type Search = { party?: string; type?: VoteTypeFilter; result?: VoteResultFilter; topic?: string; q?: string; flag?: VoteFlagFilter }

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
    scripts: breadcrumbJsonLd([{ name: 'Machtblick', path: '/en' }, { name: 'Votes', path: '/en/votes' }]),
  }),
  validateSearch: (search: Record<string, unknown>): Search => ({
    party: typeof search.party === 'string' ? search.party : undefined,
    type: isVoteType(search.type) ? search.type : undefined,
    result: isResult(search.result) ? search.result : undefined,
    topic: typeof search.topic === 'string' ? search.topic : undefined,
    q: typeof search.q === 'string' ? search.q : undefined,
    flag: isVoteFlagFilter(search.flag) ? search.flag : undefined,
  }),
  search: { middlewares: [stripSearchParams({ flag: 'all' as VoteFlagFilter })] },
})

function VotesRoute() {
  const votes = Route.useLoaderData()
  const { party, type, result, topic, q, flag } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
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
