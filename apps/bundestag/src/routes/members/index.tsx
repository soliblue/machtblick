import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { listMembers, type MandateType, type MemberSex } from '@/server/members'
import { MembersList } from '@/views/membersList/MembersList'
import { useMemberListFilters } from '@/hooks/useMemberListFilters'
import { seoMeta, canonicalLink } from '@/lib/seo'
import { isAgeBucket, isMandateType, isSex, type AgeBucket } from '@/lib/ageBuckets'

type Search = {
  party?: string
  state?: string
  sex?: MemberSex
  age?: AgeBucket
  mandate?: MandateType
  q?: string
}

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
    sex: isSex(search.sex) ? search.sex : undefined,
    age: isAgeBucket(search.age) ? search.age : undefined,
    mandate: isMandateType(search.mandate) ? search.mandate : undefined,
    q: typeof search.q === 'string' ? search.q : undefined,
  }),
})

function MembersRoute() {
  const members = Route.useLoaderData()
  const { party, state, sex, age, mandate, q } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const partyValue = party ?? null
  const stateValue = state ?? null
  const sexValue = sex ?? null
  const ageValue = age ?? null
  const mandateValue = mandate ?? null
  const query = q ?? ''
  const {
    filtered,
    availableParties,
    availableStates,
    availableSexes,
    availableAgeBuckets,
    availableMandateTypes,
    sortKey,
    sortDir,
    toggleSort,
  } = useMemberListFilters(members, partyValue, stateValue, sexValue, ageValue, mandateValue, query)
  return (
    <MembersList
      members={filtered}
      party={partyValue}
      onPartyChange={(v) => navigate({ search: (s) => ({ ...s, party: v ?? undefined }) })}
      availableParties={availableParties}
      state={stateValue}
      onStateChange={(v) => navigate({ search: (s) => ({ ...s, state: v ?? undefined }) })}
      availableStates={availableStates}
      sex={sexValue}
      onSexChange={(v) => navigate({ search: (s) => ({ ...s, sex: v ?? undefined }) })}
      availableSexes={availableSexes}
      ageBucket={ageValue}
      onAgeBucketChange={(v) => navigate({ search: (s) => ({ ...s, age: v ?? undefined }) })}
      availableAgeBuckets={availableAgeBuckets}
      mandateType={mandateValue}
      onMandateTypeChange={(v) => navigate({ search: (s) => ({ ...s, mandate: v ?? undefined }) })}
      availableMandateTypes={availableMandateTypes}
      query={query}
      onQueryChange={(v) => navigate({ search: (s) => ({ ...s, q: v.trim() ? v : undefined }) })}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={toggleSort}
    />
  )
}
