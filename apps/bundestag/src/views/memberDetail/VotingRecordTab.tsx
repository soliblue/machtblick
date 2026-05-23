import type { MemberVoteRow } from '@/server/members'
import { formatDate } from '@/lib/format'
import { FilterPill } from '@/views/votesList/FilterPill'
import { Stamp } from '@/views/votesList/Stamp'
import { VoteChoicePill } from './VoteChoicePill'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

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
    nicht_abgegeben: '-',
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
      <div className="mb-m flex flex-wrap items-center gap-s">
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
      </div>
      {filtered.map((r) => (
        <a
          key={r.voteId}
          href={withLocale(`/votes/${r.voteId}/`, locale)}
          className="flex flex-col border-t py-m transition-opacity hover:opacity-80"
          style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 8%, transparent)' }}
        >
          <span className="text-m" style={{ overflowWrap: 'anywhere' }}>{r.cleanTitle ?? r.title}</span>
          <div className="mt-s flex flex-wrap items-center justify-between gap-x-m gap-y-s">
            <span className="flex flex-wrap items-center gap-s text-s opacity-l">
              <span className="whitespace-nowrap">{formatDate(r.date)}</span>
              <Stamp variant={r.result} size="s" />
              {r.defected === true ? <Stamp variant="abweichler" size="s" /> : null}
            </span>
            <VoteChoicePill choice={r.choice} />
          </div>
        </a>
      ))}
    </div>
  )
}
