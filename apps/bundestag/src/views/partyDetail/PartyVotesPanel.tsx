import type { PartyDetail as PartyDetailData, PartyVote } from '@/server/partyDetail'
import { formatDateShort, pct } from '@/lib/format'
import { FilterPill } from '@/views/votesList/FilterPill'
import { FilterPillRow } from '@/views/votesList/FilterPillRow'
import { VoteChoicePill } from '@/views/memberDetail/VoteChoicePill'
import { PartyLineFingerprint } from './PartyLineFingerprint'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

type Result = 'angenommen' | 'abgelehnt'
const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 8%, transparent)'
const CHOICE = { yes: 'ja', no: 'nein', abstain: 'enthalten' } as const

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
  const voteLabels: Record<PartyVote, string> = { yes: t.yes, no: t.no, abstain: t.abstain, split: t.stanceLabels.split }
  return (
    <div>
      <PartyLineFingerprint votes={data.votes} filter={partyVote} onFilterChange={onPartyVoteChange} />
      <FilterPillRow className="mb-m">
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
            className="grid grid-cols-[104px_minmax(0,1fr)] items-start gap-m border-t py-m transition-opacity hover:opacity-80"
            style={{ borderColor: ROW_BORDER }}
          >
            {v.partyVote === 'split' ? (
              <span className="w-fit whitespace-nowrap border border-current px-s py-[2px] text-[11px] font-semibold caption opacity-l">
                {t.stanceLabels.split}
              </span>
            ) : (
              <VoteChoicePill choice={CHOICE[v.partyVote]} />
            )}
            <div className="min-w-0">
              <div className="font-display text-l font-semibold" style={{ overflowWrap: 'anywhere' }}>{v.cleanTitle}</div>
              <div className="mt-s flex flex-wrap items-center gap-x-s gap-y-xs text-s caption">
                <span className="opacity-l">{formatDateShort(v.date, locale)}</span>
                {v.cohesion !== null && v.cohesion < 0.95 && (
                  <>
                    <span className="opacity-l" aria-hidden="true">·</span>
                    <span className="font-semibold text-danger">{t.cohesion} <span className="tabular-nums">{pct(v.cohesion)}</span></span>
                  </>
                )}
                <span className="opacity-l" aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-xs opacity-l">
                  <span
                    className="size-[6px] shrink-0"
                    style={{ background: v.result === 'angenommen' ? 'var(--color-success)' : 'var(--color-danger)' }}
                  />
                  {resultLabels[v.result]}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
