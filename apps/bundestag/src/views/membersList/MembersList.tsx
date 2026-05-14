import { SlidersHorizontal, Users, MapPin, Search } from 'lucide-react'
import type { MemberListItem } from '@/server/members'
import { MemberRow } from './MemberRow'
import { FilterPill } from '@/views/votesList/FilterPill'
import type { MemberSortKey, SortDir } from '@/hooks/useMemberListFilters'

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

type Props = {
  members: MemberListItem[]
  party: string | null
  onPartyChange: (value: string | null) => void
  availableParties: string[]
  state: string | null
  onStateChange: (value: string | null) => void
  availableStates: string[]
  query: string
  onQueryChange: (value: string) => void
  sortKey: MemberSortKey
  sortDir: SortDir
  onSort: (key: MemberSortKey) => void
}

export function MembersList({ members, party, onPartyChange, availableParties, state, onStateChange, availableStates, query, onQueryChange, sortKey, sortDir, onSort }: Props) {
  return (
    <main className="mx-auto max-w-3xl p-l">
      <h1 className="sr-only">Abgeordnete</h1>
      <div className="mb-m relative min-w-[12rem]">
        <Search size={14} className="absolute left-s top-1/2 -translate-y-1/2 opacity-l" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Abgeordnete durchsuchen"
          className="w-full border bg-transparent py-xs pl-[1.75rem] pr-s text-m outline-none focus:border-fg"
          style={{ borderColor: ROW_BORDER }}
        />
      </div>
      <div className="mb-l flex flex-wrap items-center justify-between gap-m">
        <div className="flex flex-wrap items-center gap-s">
          <SlidersHorizontal size={17} className="opacity-l" />
          <FilterPill label="Fraktion" icon={Users} options={availableParties} value={party} onChange={onPartyChange} />
          <FilterPill label="Bundesland" icon={MapPin} options={availableStates} value={state} onChange={onStateChange} />
        </div>
        <span className="text-s opacity-l">{members.length} Personen</span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-m text-s uppercase opacity-l sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]" style={{ letterSpacing: '0.08em' }}>
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
      aria-label={`Sortieren nach ${label}${active ? (sortDir === 'asc' ? ', aufsteigend' : ', absteigend') : ''}`}
      className={`flex items-center gap-xs hover:opacity-100 ${width ?? ''} ${align === 'right' ? 'justify-end' : ''}`}
      style={{ opacity: active ? 1 : undefined, fontWeight: active ? 600 : undefined }}
    >
      {label} {arrow}
    </button>
  )
}
