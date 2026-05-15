import { SlidersHorizontal, Users, MapPin, Search, User, Cake, Vote } from 'lucide-react'
import type { MandateType, MemberListItem, MemberSex } from '@/server/members'
import { MemberRow } from './MemberRow'
import { FilterPill } from '@/views/votesList/FilterPill'
import type { MemberSortKey, SortDir } from '@/hooks/useMemberListFilters'
import { isAgeBucket, isMandateType, isSex, type AgeBucket } from '@/lib/ageBuckets'
import { MembersStatsStrip } from './MembersStatsStrip'
import type { MemberStats } from '@/hooks/useMemberStats'
import { useCopy } from '@/lib/i18n'

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

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
    <main className="mx-auto max-w-3xl p-l">
      <h1 className="sr-only">{t.members}</h1>
      <div className="mb-m relative min-w-[12rem]">
        <Search size={14} className="absolute left-s top-1/2 -translate-y-1/2 opacity-l" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t.searchMembers}
          className="w-full border bg-transparent py-xs pl-[1.75rem] pr-s text-m outline-none focus:border-fg"
          style={{ borderColor: ROW_BORDER }}
        />
      </div>
      <div className="mb-l -mx-l flex items-center gap-s overflow-x-auto px-l [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SlidersHorizontal size={17} className="shrink-0 opacity-l" />
        <FilterPill label={t.navParties} icon={Users} options={availableParties} value={party} onChange={onPartyChange} />
        <FilterPill label={t.state} icon={MapPin} options={availableStates} value={state} onChange={onStateChange} />
        <FilterPill
          label={t.sex}
          icon={User}
          options={availableSexes}
          value={sex}
          onChange={(v) => onSexChange(isSex(v) ? v : null)}
          formatOption={(v) => (isSex(v) ? t.sexLabels[v] : v)}
        />
        <FilterPill
          label={t.age}
          icon={Cake}
          options={availableAgeBuckets}
          value={ageBucket}
          onChange={(v) => onAgeBucketChange(isAgeBucket(v) ? v : null)}
          formatOption={(v) => (isAgeBucket(v) ? t.ageLabels[v] : v)}
        />
        <FilterPill
          label={t.mandate}
          icon={Vote}
          options={availableMandateTypes}
          value={mandateType}
          onChange={(v) => onMandateTypeChange(isMandateType(v) ? v : null)}
          formatOption={(v) => (isMandateType(v) ? t.mandateLabels[v] : v)}
        />
      </div>
      <div className="mb-l">
        <MembersStatsStrip stats={stats} />
      </div>
      <div className="mb-l flex justify-end">
        <span className="text-s opacity-l">{members.length} {t.people}</span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-m text-s uppercase opacity-l sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]" style={{ letterSpacing: '0.08em' }}>
        <SortHeader label={t.name} k="name" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
        <SortHeader label={t.party} k="party" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
        <div className="hidden sm:contents">
          <SortHeader label={t.state} k="state" sortKey={sortKey} sortDir={sortDir} onSort={onSort} width="w-32" />
        </div>
        <SortHeader label={t.attendance} k="attendance" sortKey={sortKey} sortDir={sortDir} onSort={onSort} width="w-16 sm:w-20" align="right" />
        <SortHeader label={t.line} k="loyalty" sortKey={sortKey} sortDir={sortDir} onSort={onSort} width="w-16 sm:w-20" align="right" />
      </div>
      <div className="flex flex-col">
        {members.map((m) => <MemberRow key={m.id} member={m} />)}
      </div>
    </main>
  )
}

function SortHeader({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
  width,
  align = 'left',
}: {
  label: string
  k: MemberSortKey
  sortKey: MemberSortKey
  sortDir: SortDir
  onSort: (key: MemberSortKey) => void
  width?: string
  align?: 'left' | 'right'
}) {
  const active = sortKey === k
  const arrow = active ? (sortDir === 'asc' ? '↑' : '↓') : ''
  const t = useCopy()
  return (
    <button
      type="button"
      onClick={() => onSort(k)}
      aria-label={`${t.sortBy} ${label}${active ? (sortDir === 'asc' ? `, ${t.ascending}` : `, ${t.descending}`) : ''}`}
      className={`flex items-center gap-xs hover:opacity-100 ${width ?? ''} ${align === 'right' ? 'justify-end' : ''}`}
      style={{ opacity: active ? 1 : undefined, fontWeight: active ? 600 : undefined }}
    >
      {label} {arrow}
    </button>
  )
}
