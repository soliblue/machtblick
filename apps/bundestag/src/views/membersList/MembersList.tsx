import { Search } from 'lucide-react'
import type { MandateType, MemberListItem, MemberSex } from '@/server/members'
import { MemberCard } from './MemberCard'
import { SortControl } from './SortControl'
import { FilterPill } from '@/views/votesList/FilterPill'
import { FilterPillRow } from '@/views/votesList/FilterPillRow'
import { FilterSheet, type FilterSheetGroup, type FilterSheetSort } from '@/views/votesList/FilterSheet'
import type { MemberSortKey, SortDir } from '@/hooks/useMemberListFilters'
import { isAgeBucket, isMandateType, isSex, type AgeBucket } from '@/lib/ageBuckets'
import { partyLabel } from '@/lib/parties'
import { useCopy, useLocale } from '@/lib/i18n'

const HAIR = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

type Props = {
  members: MemberListItem[]
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
  const locale = useLocale()
  const sheetGroups: FilterSheetGroup[] = [
    { key: 'party', label: t.parliamentaryGroup, options: availableParties, value: party, onChange: onPartyChange, format: (o) => partyLabel(o, locale) },
    { key: 'state', label: t.state, options: availableStates, value: state, onChange: onStateChange, format: (o) => o },
    { key: 'sex', label: t.sex, options: availableSexes, value: sex, onChange: (v) => onSexChange(isSex(v) ? v : null), format: (o) => (isSex(o) ? t.sexLabels[o] : o) },
    { key: 'age', label: t.age, options: availableAgeBuckets, value: ageBucket, onChange: (v) => onAgeBucketChange(isAgeBucket(v) ? v : null), format: (o) => (isAgeBucket(o) ? t.ageLabels[o] : o) },
    { key: 'mandate', label: t.mandate, options: availableMandateTypes, value: mandateType, onChange: (v) => onMandateTypeChange(isMandateType(v) ? v : null), format: (o) => (isMandateType(o) ? t.mandateLabels[o] : o) },
  ]
  const sheetSort: FilterSheetSort = {
    label: t.sortLabel,
    options: [
      { key: 'name', label: t.name },
      { key: 'attendance', label: t.attendance },
      { key: 'loyalty', label: t.line },
    ],
    value: sortKey,
    dir: sortDir,
    onSelect: (k) => onSort(k as MemberSortKey),
  }
  const activeCount = [party, state, sex, ageBucket, mandateType].filter(Boolean).length
  return (
    <>
      <div className="mx-auto max-w-5xl px-l pb-m pt-l">
        <h1 className="sr-only">{t.members}</h1>
        <div className="relative">
          <Search size={14} className="absolute left-s top-1/2 -translate-y-1/2 opacity-l" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t.searchMembers}
            className="w-full border bg-transparent py-xs pl-[1.75rem] pr-s text-m outline-none focus:border-fg"
            style={{ borderColor: HAIR }}
          />
        </div>
      </div>
      <div className="sticky top-[54px] z-20 hidden border-b border-fg/15 bg-background desk:block">
        <div className="px-l py-s desk:mx-auto desk:max-w-5xl">
          <FilterPillRow className="">
            <FilterPill label={t.navParties} options={availableParties} value={party} onChange={onPartyChange} />
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
      <main className="mx-auto max-w-5xl px-l pb-[96px] pt-l desk:pb-[64px]">
        <div className="mb-m flex items-center justify-between">
          <span className="text-s caption opacity-l">{members.length} {t.people}</span>
          <div className="hidden desk:block">
            <SortControl sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          </div>
        </div>
        {members.length === 0 ? (
          <p className="py-xl text-center text-s opacity-l">{t.noMembersFound}</p>
        ) : (
          <div className="grid grid-cols-2 gap-s sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 desk:gap-m">
            {members.map((m) => <MemberCard key={m.id} member={m} />)}
          </div>
        )}
      </main>
      <div className="desk:hidden">
        <FilterSheet groups={sheetGroups} activeCount={activeCount} sort={sheetSort} />
      </div>
    </>
  )
}
