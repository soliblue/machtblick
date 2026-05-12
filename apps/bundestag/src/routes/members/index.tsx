import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { listMembers } from '@/server/members'
import { MembersList } from '@/views/membersList/MembersList'
import { useMemberListFilters } from '@/hooks/useMemberListFilters'
import { seoMeta, canonicalLink } from '@/lib/seo'

type Search = { party?: string; state?: string; q?: string }

export const Route = createFileRoute('/members/')({
  component: MembersRoute,
  loader: () => listMembers(),
  head: () => ({
    meta: seoMeta({
      title: 'Abgeordnete',
      description: 'Alle Abgeordneten des Deutschen Bundestags mit Fraktion, Bundesland, Anwesenheit und Linientreue.',
      canonical: '/members',
    }),
    links: canonicalLink('/members'),
  }),
  validateSearch: (search: Record<string, unknown>): Search => ({
    party: typeof search.party === 'string' ? search.party : undefined,
    state: typeof search.state === 'string' ? search.state : undefined,
    q: typeof search.q === 'string' ? search.q : undefined,
  }),
})

function MembersRoute() {
  const members = Route.useLoaderData()
  const { party, state, q } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const partyValue = party ?? null
  const stateValue = state ?? null
  const query = q ?? ''
  const { filtered, availableParties, availableStates, sortKey, sortDir, toggleSort } = useMemberListFilters(
    members,
    partyValue,
    stateValue,
    query,
  )
  return (
    <MembersList
      members={filtered}
      party={partyValue}
      onPartyChange={(v) => navigate({ search: (s) => ({ ...s, party: v ?? undefined }) })}
      availableParties={availableParties}
      state={stateValue}
      onStateChange={(v) => navigate({ search: (s) => ({ ...s, state: v ?? undefined }) })}
      availableStates={availableStates}
      query={query}
      onQueryChange={(v) => navigate({ search: (s) => ({ ...s, q: v.trim() ? v : undefined }) })}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={toggleSort}
    />
  )
}
