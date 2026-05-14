import { Filter, Vote, Scale } from 'lucide-react'
import { Link } from '../../lib/Link'
import type { PartyDetail as PartyDetailData, PartyVote } from '@/server/parties'
import { formatDate } from '@/lib/format'
import { FilterPill } from '@/views/votesList/FilterPill'
import { Stamp } from '@/views/votesList/Stamp'

type Result = 'angenommen' | 'abgelehnt'
const RESULT_LABELS: Record<Result, string> = { angenommen: 'Akzeptiert', abgelehnt: 'Abgelehnt' }
const VOTE_LABELS: Record<PartyVote, string> = { yes: 'Ja', no: 'Nein', abstain: 'Enthalten', split: 'Geteilt' }
const VOTE_COLOR: Record<PartyVote, string> = {
  yes: 'var(--color-success)',
  no: 'var(--color-danger)',
  abstain: 'var(--color-fg)',
  split: 'var(--color-fg)',
}

type Props = {
  data: PartyDetailData
  result: Result | null
  onResultChange: (value: Result | null) => void
  partyVote: PartyVote | null
  onPartyVoteChange: (value: PartyVote | null) => void
}

export function PartyVotesPanel({ data, result, onResultChange, partyVote, onPartyVoteChange }: Props) {
  const votes = data.votes.filter((v) => (!result || v.result === result) && (!partyVote || v.partyVote === partyVote))
  return (
    <div>
      <div className="mb-l flex flex-wrap items-center gap-s">
        <Filter size={14} className="opacity-l" />
        <FilterPill
          label="Fraktion stimmte"
          icon={Vote}
          options={['yes', 'no', 'abstain', 'split']}
          value={partyVote}
          onChange={(v) => onPartyVoteChange(v as PartyVote | null)}
          formatOption={(o) => VOTE_LABELS[o as PartyVote]}
        />
        <FilterPill
          label="Ergebnis"
          icon={Scale}
          options={['angenommen', 'abgelehnt']}
          value={result}
          onChange={(v) => onResultChange(v as Result | null)}
          formatOption={(o) => RESULT_LABELS[o as Result]}
        />
      </div>
      <div className="flex flex-col">
        {votes.map((v) => (
          <Link
            key={v.voteId}
            to="/votes/$id/"
            params={{ id: v.voteId }}
            className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-l border-t py-m text-m transition-opacity first:border-t-0 hover:opacity-80"
            style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
          >
            <div className="flex min-w-0 flex-col">
              <span style={{ overflowWrap: 'anywhere' }}>{v.cleanTitle ?? v.title}</span>
              <span className="text-s opacity-l">{formatDate(v.date)}</span>
            </div>
            <VoteChip vote={v.partyVote} />
            <Stamp variant={v.result} />
          </Link>
        ))}
      </div>
    </div>
  )
}

function VoteChip({ vote }: { vote: PartyVote }) {
  const color = VOTE_COLOR[vote]
  return (
    <span
      className="px-s py-xs text-s font-semibold"
      style={{ background: `color-mix(in oklab, ${color} 18%, transparent)`, color }}
    >
      {VOTE_LABELS[vote]}
    </span>
  )
}
