import type { MemberInitiativeRow as MemberInitiativeRowData } from '@/server/memberInitiatives'
import { formatDate } from '@/lib/format'
import { useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'
import { Stamp, type StampVariant } from '@/views/votesList/Stamp'

const BORDER = 'color-mix(in oklab, var(--color-fg) 8%, transparent)'

type Props = { row: MemberInitiativeRowData }

export function ProposalRow({ row }: Props) {
  const locale = useLocale()
  const vote = row.linkedVotes[0]
  const voteHref = vote ? withLocale(`/votes/${vote.voteId}/`, locale) : null
  const antragHref = withLocale(`/motions/${row.antragId}/`, locale)
  const title = row.cleanTitle ?? row.title
  const statusStamp: StampVariant | null =
    vote ? null
    : row.beratungsstand === 'Abgelehnt' ? 'abgelehnt'
    : row.beratungsstand === 'Überwiesen' ? 'ueberwiesen'
    : row.beratungsstand === 'Beschlussempfehlung liegt vor' ? 'beschlussempfehlung'
    : row.beratungsstand === 'Noch nicht beraten' ? 'nicht-beraten'
    : null
  const introducedDate = row.introducedDate ? formatDate(row.introducedDate) : null
  const signatories = `${row.signatoryCount} ${locale === 'en' ? 'signatories' : 'Unterzeichner'}`
  return (
    <div className="flex flex-col border-t py-m" style={{ borderColor: BORDER }}>
      <a href={voteHref ?? antragHref} className="text-m font-semibold underline-offset-4 hover:underline" style={{ overflowWrap: 'anywhere' }}>{title}</a>
      <div className="mt-s flex flex-wrap items-center gap-s text-s">
        {introducedDate ? <span className="opacity-l">{introducedDate}</span> : null}
        {statusStamp ? <Stamp variant={statusStamp} size="s" /> : null}
        {vote && voteHref ? (
          <a href={voteHref} className="inline-flex flex-wrap items-center gap-s opacity-l transition-opacity hover:opacity-100">
            <span>{locale === 'en' ? 'Vote' : 'Abstimmung'} {formatDate(vote.date)}</span>
            <Stamp variant={vote.result} size="s" />
          </a>
        ) : null}
        <span className="opacity-l">{signatories}</span>
      </div>
      {row.sachgebiet.length > 0 ? (
        <div className="mt-s flex flex-wrap gap-xs">
          {row.sachgebiet.slice(0, 3).map((topic) => (
            <span key={topic} className="border px-s py-[2px] text-s opacity-l" style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}>{topic}</span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
