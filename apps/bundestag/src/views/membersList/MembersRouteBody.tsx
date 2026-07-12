import { useLoaderData, useNavigate, useSearch } from '@tanstack/react-router'
import { MembersList } from './MembersList'
import { useMemberListFilters } from '@/hooks/useMemberListFilters'
import { useMemberStats } from '@/hooks/useMemberStats'

type Props = { from: '/members/' | '/en/members/' }

export function MembersRouteBody({ from }: Props) {
  const members = useLoaderData({ from })
  const { party, state, sex, age, mandate, q } = useSearch({ from })
  const navigate = useNavigate({ from })
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
  const stats = useMemberStats(filtered)
  return (
    <MembersList
      members={filtered}
      stats={stats}
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
