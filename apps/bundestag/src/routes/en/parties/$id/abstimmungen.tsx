import { createFileRoute, useLoaderData, useNavigate } from '@tanstack/react-router'
import { PartyVotesPanel } from '@/views/partyDetail/PartyVotesPanel'
import type { PartyVote } from '@/server/parties'

type Result = 'angenommen' | 'abgelehnt'
const isResult = (v: unknown): v is Result => v === 'angenommen' || v === 'abgelehnt'
const VOTES: PartyVote[] = ['yes', 'no', 'abstain', 'split']
const isVote = (v: unknown): v is PartyVote => typeof v === 'string' && (VOTES as string[]).includes(v)

type Search = { result?: Result; vote?: PartyVote }

export const Route = createFileRoute('/en/parties/$id/abstimmungen')({
  component: AbstimmungenRoute,
  validateSearch: (search: Record<string, unknown>): Search => ({
    result: isResult(search.result) ? search.result : undefined,
    vote: isVote(search.vote) ? search.vote : undefined,
  }),
})

function AbstimmungenRoute() {
  const data = useLoaderData({ from: '/en/parties/$id' })
  const { result, vote } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  return data ? (
    <PartyVotesPanel
      data={data}
      result={result ?? null}
      onResultChange={(v) => navigate({ search: (s) => ({ ...s, result: v ?? undefined }) })}
      partyVote={vote ?? null}
      onPartyVoteChange={(v) => navigate({ search: (s) => ({ ...s, vote: v ?? undefined }) })}
    />
  ) : null
}
