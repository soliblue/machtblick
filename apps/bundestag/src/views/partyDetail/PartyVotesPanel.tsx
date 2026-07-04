import type { PartyDetail as PartyDetailData, PartyVote } from '@/server/parties'
import { formatDate } from '@/lib/format'
import { FilterPill } from '@/views/votesList/FilterPill'
import { FilterPillRow } from '@/views/votesList/FilterPillRow'
import { Stamp } from '@/views/votesList/Stamp'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

type Result = 'angenommen' | 'abgelehnt'
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
  const locale = useLocale()
  const t = useCopy()
  const resultLabels: Record<Result, string> = { angenommen: t.accepted, abgelehnt: t.rejected }
  const voteLabels: Record<PartyVote, string> = { yes: t.yes, no: t.no, abstain: t.abstain, split: t.split }
  return (
    <div>
      <FilterPillRow>
        <FilterPill
          label={t.partyVoted}
          options={['yes', 'no', 'abstain', 'split']}
          value={partyVote}
          onChange={(v) => onPartyVoteChange(v as PartyVote | null)}
          formatOption={(o) => voteLabels[o as PartyVote]}
        />
        <FilterPill
          label={t.result}
          options={['angenommen', 'abgelehnt']}
          value={result}
          onChange={(v) => onResultChange(v as Result | null)}
          formatOption={(o) => resultLabels[o as Result]}
        />
      </FilterPillRow>
      <div className="flex flex-col">
        {votes.map((v) => (
          <a
            key={v.voteId}
            href={withLocale(`/votes/${v.voteId}/`, locale)}
            className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-l border-t py-m text-m transition-opacity first:border-t-0 hover:opacity-80"
            style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
          >
            <div className="flex min-w-0 flex-col">
              <span style={{ overflowWrap: 'anywhere' }}>{v.cleanTitle}</span>
              <span className="text-s opacity-l">{formatDate(v.date)}</span>
            </div>
            <VoteChip vote={v.partyVote} label={voteLabels[v.partyVote]} />
            <Stamp variant={v.result} />
          </a>
        ))}
      </div>
    </div>
  )
}

function VoteChip({ vote, label }: { vote: PartyVote; label: string }) {
  const color = VOTE_COLOR[vote]
  return (
    <span
      className="px-s py-xs text-s font-semibold"
      style={{ background: `color-mix(in oklab, ${color} 18%, transparent)`, color }}
    >
      {label}
    </span>
  )
}
