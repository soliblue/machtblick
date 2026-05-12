import { SlidersHorizontal, Users, MapPin } from 'lucide-react'
import type { MemberListItem } from '@/server/members'
import { MemberRow } from './MemberRow'
import { FilterPill } from '@/views/votesList/FilterPill'
import type { MemberSortKey, SortDir } from '@/hooks/useMemberListFilters'

type Props = {
  members: MemberListItem[]
  party: string | null
  onPartyChange: (value: string | null) => void
  availableParties: string[]
  state: string | null
  onStateChange: (value: string | null) => void
  availableStates: string[]
  sortKey: MemberSortKey
  sortDir: SortDir
  onSort: (key: MemberSortKey) => void
}

export function MembersList({ members, party, onPartyChange, availableParties, state, onStateChange, availableStates, sortKey, sortDir, onSort }: Props) {
  return (
    <main className="mx-auto max-w-3xl p-l">
      <div className="mb-l flex items-center justify-between gap-m">
        <div className="flex flex-wrap items-center gap-s">
          <SlidersHorizontal size={17} className="opacity-l" />
          <FilterPill label="Fraktion" icon={Users} options={availableParties} value={party} onChange={onPartyChange} />
          <FilterPill label="Bundesland" icon={MapPin} options={availableStates} value={state} onChange={onStateChange} />
        </div>
        <span className="text-s opacity-l">{members.length} Personen</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-m text-s uppercase opacity-l sm:grid-cols-[1fr_auto_auto_auto_auto]" style={{ letterSpacing: '0.08em' }}>
        <SortHeader label="Name" k="name" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
        <SortHeader label="Partei" k="party" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
        <div className="hidden sm:contents">
          <SortHeader label="Bundesland" k="state" sortKey={sortKey} sortDir={sortDir} onSort={onSort} width="w-32" />
        </div>
        <SortHeader label="Anwes." k="attendance" sortKey={sortKey} sortDir={sortDir} onSort={onSort} width="w-16 sm:w-20" align="right" />
        <SortHeader label="Linie" k="loyalty" sortKey={sortKey} sortDir={sortDir} onSort={onSort} width="w-16 sm:w-20" align="right" />
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
  return (
    <button
      type="button"
      onClick={() => onSort(k)}
      className={`flex items-center gap-xs hover:opacity-100 ${width ?? ''} ${align === 'right' ? 'justify-end' : ''}`}
      style={{ opacity: active ? 1 : undefined, fontWeight: active ? 600 : undefined }}
    >
      {label} {arrow}
    </button>
  )
}
