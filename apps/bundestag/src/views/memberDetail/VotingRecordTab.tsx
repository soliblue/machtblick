import type { MemberVoteRow } from '@/server/memberDetail'
import { formatDateShort } from '@/lib/format'
import { FilterPill } from '@/views/votesList/FilterPill'
import { FilterPillRow } from '@/views/votesList/FilterPillRow'
import { VoteChoicePill } from './VoteChoicePill'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 8%, transparent)'

type Props = {
  history: MemberVoteRow[]
  lineFilter: string | null
  setLineFilter: (v: string | null) => void
  choiceFilter: string | null
  setChoiceFilter: (v: string | null) => void
}

export function VotingRecordTab({ history, lineFilter, setLineFilter, choiceFilter, setChoiceFilter }: Props) {
  const locale = useLocale()
  const t = useCopy()
  const choiceLabel: Record<string, string> = {
    ja: t.yes,
    nein: t.no,
    enthalten: t.abstain,
    nicht_abgegeben: t.absent,
  }
  const lineLabel: Record<string, string> = {
    linie: t.line,
    abw: t.deviations,
  }
  const filtered = history.filter((r) => {
    const lineOk = lineFilter ? (r.defected !== null && (lineFilter === 'abw' ? r.defected : !r.defected)) : true
    const choiceOk = choiceFilter ? r.choice === choiceFilter : true
    return lineOk && choiceOk
  })
  return (
    <div className="flex flex-col">
      <FilterPillRow className="mb-m">
        <FilterPill
          label={t.line}
          options={['linie', 'abw']}
          value={lineFilter}
          onChange={setLineFilter}
          formatOption={(o) => lineLabel[o] ?? o}
        />
        <FilterPill
          label={t.vote}
          options={['ja', 'nein', 'enthalten', 'nicht_abgegeben']}
          value={choiceFilter}
          onChange={setChoiceFilter}
          formatOption={(o) => choiceLabel[o] ?? o}
        />
      </FilterPillRow>
      {filtered.map((r) => (
        <a
          key={r.voteId}
          href={withLocale(`/votes/${r.voteId}/`, locale)}
          className="grid grid-cols-[104px_minmax(0,1fr)] items-start gap-m border-t py-m transition-opacity hover:opacity-80"
          style={{ borderColor: ROW_BORDER }}
        >
          <VoteChoicePill choice={r.choice} />
          <div className="min-w-0">
            <div className="font-display text-l font-semibold" style={{ overflowWrap: 'anywhere' }}>{r.cleanTitle}</div>
            <div className="mt-s flex flex-wrap items-center gap-x-s gap-y-xs text-s caption">
              <span className="opacity-l">{formatDateShort(r.date, locale)}</span>
              {r.defected === true && (
                <>
                  <span className="opacity-l" aria-hidden="true">·</span>
                  <span className="font-semibold text-danger">{t.deviatedFromLine} {choiceLabel[r.partyMajority]}</span>
                </>
              )}
              <span className="opacity-l" aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-xs opacity-l">
                <span
                  className="size-[6px] shrink-0"
                  style={{ background: r.result === 'angenommen' ? 'var(--color-success)' : 'var(--color-danger)' }}
                />
                {r.result === 'angenommen' ? t.accepted : t.rejected}
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}
