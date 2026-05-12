import { SlidersHorizontal, Vote, Flag, Scale, Search } from 'lucide-react'
import type { VoteListItem } from '@/server/votes'
import type { VoteTypeFilter, VoteResultFilter } from '@/hooks/useVoteListFilters'
import { VoteRow } from './VoteRow'
import { FilterPill } from './FilterPill'

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

const TYPE_LABELS: Record<VoteTypeFilter, string> = {
  namentlich: 'Namentlich',
  handzeichen: 'Handzeichen',
  hammelsprung: 'Hammelsprung',
}

const RESULT_LABELS: Record<VoteResultFilter, string> = {
  angenommen: 'Angenommen',
  abgelehnt: 'Abgelehnt',
}

type Props = {
  votes: VoteListItem[]
  proposingParty: string | null
  onProposingPartyChange: (value: string | null) => void
  availableParties: string[]
  voteType: VoteTypeFilter | null
  onVoteTypeChange: (value: VoteTypeFilter | null) => void
  result: VoteResultFilter | null
  onResultChange: (value: VoteResultFilter | null) => void
  query: string
  onQueryChange: (value: string) => void
}

export function VotesList({ votes, proposingParty, onProposingPartyChange, availableParties, voteType, onVoteTypeChange, result, onResultChange, query, onQueryChange }: Props) {
  return (
    <main className="mx-auto max-w-3xl p-l">
      <div className="mb-m relative min-w-[12rem]">
        <Search size={14} className="absolute left-s top-1/2 -translate-y-1/2 opacity-l" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Abstimmungen durchsuchen"
          className="w-full border bg-transparent py-xs pl-[1.75rem] pr-s text-m outline-none focus:border-fg"
          style={{ borderColor: ROW_BORDER }}
        />
      </div>
      <div className="mb-l -mx-l flex items-center gap-s overflow-x-auto px-l [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SlidersHorizontal size={17} className="shrink-0 opacity-l" />
        <FilterPill
          label="Typ"
          icon={Vote}
          options={['namentlich', 'handzeichen', 'hammelsprung']}
          value={voteType}
          onChange={(v) => onVoteTypeChange(v as VoteTypeFilter | null)}
          formatOption={(o) => TYPE_LABELS[o as VoteTypeFilter]}
        />
        <FilterPill
          label="Antragsteller"
          icon={Flag}
          options={availableParties}
          value={proposingParty}
          onChange={onProposingPartyChange}
        />
        <FilterPill
          label="Ergebnis"
          icon={Scale}
          options={['angenommen', 'abgelehnt']}
          value={result}
          onChange={(v) => onResultChange(v as VoteResultFilter | null)}
          formatOption={(o) => RESULT_LABELS[o as VoteResultFilter]}
        />
      </div>
      <div className="flex flex-col">
        {votes.map((v) => (
          <VoteRow key={v.id} vote={v} />
        ))}
      </div>
    </main>
  )
}
