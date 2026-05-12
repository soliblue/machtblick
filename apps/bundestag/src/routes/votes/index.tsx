import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { listVotes } from '@/server/votes'
import { VotesList } from '@/views/votesList/VotesList'
import { useVoteListFilters, type VoteTypeFilter, type VoteResultFilter } from '@/hooks/useVoteListFilters'
import { seoMeta, canonicalLink } from '@/lib/seo'

const VOTE_TYPES: VoteTypeFilter[] = ['namentlich', 'handzeichen', 'hammelsprung']
const isVoteType = (v: unknown): v is VoteTypeFilter => typeof v === 'string' && (VOTE_TYPES as string[]).includes(v)
const isResult = (v: unknown): v is VoteResultFilter => v === 'angenommen' || v === 'abgelehnt'

type Search = { party?: string; type?: VoteTypeFilter; result?: VoteResultFilter }

export const Route = createFileRoute('/votes/')({
  component: VotesRoute,
  loader: () => listVotes(),
  head: () => ({
    meta: seoMeta({
      title: 'Abstimmungen',
      description: 'Alle namentlichen Abstimmungen des Deutschen Bundestags mit Antragsteller, Ergebnis und Fraktionsverhalten.',
      canonical: '/votes',
    }),
    links: canonicalLink('/votes'),
  }),
  validateSearch: (search: Record<string, unknown>): Search => ({
    party: typeof search.party === 'string' ? search.party : undefined,
    type: isVoteType(search.type) ? search.type : undefined,
    result: isResult(search.result) ? search.result : undefined,
  }),
})

function VotesRoute() {
  const votes = Route.useLoaderData()
  const { party, type, result } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const proposingParty = party ?? null
  const voteType = type ?? 'namentlich'
  const resultValue = result ?? null
  const { filtered, availableParties } = useVoteListFilters(votes, proposingParty, voteType, resultValue)
  return (
    <VotesList
      votes={filtered}
      proposingParty={proposingParty}
      onProposingPartyChange={(v) => navigate({ search: (s) => ({ ...s, party: v ?? undefined }) })}
      availableParties={availableParties}
      voteType={voteType}
      onVoteTypeChange={(v) => navigate({ search: (s) => ({ ...s, type: v ?? undefined }) })}
      result={resultValue}
      onResultChange={(v) => navigate({ search: (s) => ({ ...s, result: v ?? undefined }) })}
    />
  )
}
