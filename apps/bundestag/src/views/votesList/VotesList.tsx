import { SlidersHorizontal, Vote, Flag, Scale, Search, Tag } from 'lucide-react'
import type { VoteListItem } from '@/server/votes'
import type { VoteTypeFilter, VoteResultFilter } from '@/hooks/useVoteListFilters'
import { VISIBLE_VOTE_TYPES } from '@/lib/voteTypes'
import { useCopy } from '@/lib/i18n'
import { VoteRow } from './VoteRow'
import { FilterPill } from './FilterPill'

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

type Props = {
  votes: VoteListItem[]
  proposingParty: string | null
  onProposingPartyChange: (value: string | null) => void
  availableParties: string[]
  voteType: VoteTypeFilter | null
  onVoteTypeChange: (value: VoteTypeFilter | null) => void
  result: VoteResultFilter | null
  onResultChange: (value: VoteResultFilter | null) => void
  topic: string | null
  onTopicChange: (value: string | null) => void
  availableTopics: string[]
  query: string
  onQueryChange: (value: string) => void
}

export function VotesList({ votes, proposingParty, onProposingPartyChange, availableParties, voteType, onVoteTypeChange, result, onResultChange, topic, onTopicChange, availableTopics, query, onQueryChange }: Props) {
  const t = useCopy()
  const typeLabels: Record<VoteTypeFilter, string> = {
    namentlich: t.namedVote,
    handzeichen: t.showOfHands,
    hammelsprung: t.division,
  }
  const resultLabels: Record<VoteResultFilter, string> = {
    angenommen: t.accepted,
    abgelehnt: t.rejected,
  }
  return (
    <main className="mx-auto max-w-3xl p-l">
      <h1 className="sr-only">{t.votes}</h1>
      <div className="mb-m relative min-w-[12rem]">
        <Search size={14} className="absolute left-s top-1/2 -translate-y-1/2 opacity-l" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t.searchVotes}
          className="w-full border bg-transparent py-xs pl-[1.75rem] pr-s text-m outline-none focus:border-fg"
          style={{ borderColor: ROW_BORDER }}
        />
      </div>
      <div className="mb-l -mx-l flex items-center gap-s overflow-x-auto px-l [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SlidersHorizontal size={17} className="shrink-0 opacity-l" />
        <FilterPill
          label={t.type}
          icon={Vote}
          options={VISIBLE_VOTE_TYPES}
          value={voteType}
          onChange={(v) => onVoteTypeChange(v as VoteTypeFilter | null)}
          formatOption={(o) => typeLabels[o as VoteTypeFilter]}
        />
        <FilterPill
          label={t.proposer}
          icon={Flag}
          options={availableParties}
          value={proposingParty}
          onChange={onProposingPartyChange}
        />
        <FilterPill
          label={t.result}
          icon={Scale}
          options={['angenommen', 'abgelehnt']}
          value={result}
          onChange={(v) => onResultChange(v as VoteResultFilter | null)}
          formatOption={(o) => resultLabels[o as VoteResultFilter]}
        />
        {availableTopics.length > 0 && (
          <FilterPill
            label={t.category}
            icon={Tag}
            options={availableTopics}
            value={topic}
            onChange={onTopicChange}
          />
        )}
      </div>
      <div className="flex flex-col">
        {votes.map((v) => (
          <VoteRow key={v.id} vote={v} />
        ))}
      </div>
    </main>
  )
}
