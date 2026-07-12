import { Search } from 'lucide-react'
import type { MemberListItem } from '@/server/members'
import { MemberCard } from './MemberCard'
import { MembersStatsStrip } from './MembersStatsStrip'
import { SortControl } from './SortControl'
import type { MemberStats } from '@/hooks/useMemberStats'
import { FilterPill } from '@/views/votesList/FilterPill'
import { FilterPillRow } from '@/views/votesList/FilterPillRow'
import { FilterSheet, type FilterSheetGroup, type FilterSheetSort } from '@/views/votesList/FilterSheet'
import type { MemberSortKey, SortDir } from '@/hooks/useMemberListFilters'
import { isAgeBucket, isMandateType, isSex, type AgeBucket, type MandateType, type MemberSex } from '@/lib/memberFacets'
import { partyLabel } from '@/lib/parties'
import { useCopy, useLocale } from '@/lib/i18n'

type Props = {
  members: MemberListItem[]
  stats: MemberStats
  party: string | null
  onPartyChange: (value: string | null) => void
  availableParties: string[]
  state: string | null
  onStateChange: (value: string | null) => void
  availableStates: string[]
  sex: MemberSex | null
  onSexChange: (value: MemberSex | null) => void
  availableSexes: MemberSex[]
  ageBucket: AgeBucket | null
  onAgeBucketChange: (value: AgeBucket | null) => void
  availableAgeBuckets: AgeBucket[]
  mandateType: MandateType | null
  onMandateTypeChange: (value: MandateType | null) => void
  availableMandateTypes: MandateType[]
  query: string
  onQueryChange: (value: string) => void
  sortKey: MemberSortKey
  sortDir: SortDir
  onSort: (key: MemberSortKey) => void
}

export function MembersList({
  members,
  stats,
  party,
  onPartyChange,
  availableParties,
  state,
  onStateChange,
  availableStates,
  sex,
  onSexChange,
  availableSexes,
  ageBucket,
  onAgeBucketChange,
  availableAgeBuckets,
  mandateType,
  onMandateTypeChange,
  availableMandateTypes,
  query,
  onQueryChange,
  sortKey,
  sortDir,
  onSort,
}: Props) {
  const t = useCopy()
  return (
    <>
      <div className="mx-auto max-w-3xl px-l pb-m pt-l">
        <h1 className="sr-only">{t.members}</h1>
        <div className="relative">
          <Search size={14} className="absolute left-s top-1/2 -translate-y-1/2 opacity-l" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t.searchMembers}
            className="w-full rounded-m border border-fg/15 bg-transparent py-xs pl-[1.75rem] pr-s text-m outline-none focus:border-fg"
          />
        </div>
      </div>
      <div className="sticky top-[54px] z-20 border-b border-fg/15 bg-background">
        <div className="px-l py-s desk:mx-auto desk:max-w-3xl">
          <FilterPillRow>
            <FilterPill label={t.parliamentaryGroup} options={availableParties} value={party} onChange={onPartyChange} />
            <FilterPill label={t.state} options={availableStates} value={state} onChange={onStateChange} />
            <FilterPill
              label={t.sex}
              options={availableSexes}
              value={sex}
              onChange={(v) => onSexChange(isSex(v) ? v : null)}
              formatOption={(v) => (isSex(v) ? t.sexLabels[v] : v)}
            />
            <FilterPill
              label={t.age}
              options={availableAgeBuckets}
              value={ageBucket}
              onChange={(v) => onAgeBucketChange(isAgeBucket(v) ? v : null)}
              formatOption={(v) => (isAgeBucket(v) ? t.ageLabels[v] : v)}
            />
            <FilterPill
              label={t.mandate}
              options={availableMandateTypes}
              value={mandateType}
              onChange={(v) => onMandateTypeChange(isMandateType(v) ? v : null)}
              formatOption={(v) => (isMandateType(v) ? t.mandateLabels[v] : v)}
            />
          </FilterPillRow>
        </div>
      </div>
      <main className="mx-auto max-w-3xl px-l pb-[64px] pt-l">
        <MembersStatsStrip stats={stats} />
        <div className="mb-m mt-l flex items-center justify-between">
          <span className="text-s caption opacity-l">{members.length} {t.people}</span>
          <SortControl sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
        </div>
        {members.length === 0 ? (
          <p className="py-xl text-center text-s opacity-l">{t.noMembersFound}</p>
        ) : (
          <div className="grid grid-cols-3 gap-s sm:grid-cols-4 desk:gap-m">
            {members.map((m, i) => <MemberCard key={m.id} member={m} index={i} />)}
          </div>
        )}
      </main>
    </>
  )
}
