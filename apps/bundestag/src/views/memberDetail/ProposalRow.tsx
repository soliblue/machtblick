import type { MemberInitiativeRow as MemberInitiativeRowData } from '@/server/memberInitiatives'
import { formatDateShort } from '@/lib/format'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

const BORDER = 'color-mix(in oklab, var(--color-fg) 8%, transparent)'

type Props = { row: MemberInitiativeRowData }

export function ProposalRow({ row }: Props) {
  const locale = useLocale()
  const t = useCopy()
  const vote = row.linkedVotes[0]
  const voteHref = vote ? withLocale(`/votes/${vote.voteId}/`, locale) : null
  const antragHref = withLocale(`/motions/${row.antragId}/`, locale)
  const title = row.cleanTitle ?? row.title
  const statusLabel =
    vote ? null
    : row.beratungsstand === 'Abgelehnt' ? t.stampClose.abgelehnt
    : row.beratungsstand === 'Überwiesen' ? t.stampClose.ueberwiesen
    : row.beratungsstand === 'Beschlussempfehlung liegt vor' ? t.stampClose.beschlussempfehlung
    : row.beratungsstand === 'Noch nicht beraten' ? t.stampClose['nicht-beraten']
    : null
  const signatories = `${row.signatoryCount} ${locale === 'en' ? 'signatories' : 'Unterzeichner'}`
  return (
    <div className="flex flex-col border-t py-m" style={{ borderColor: BORDER }}>
      <a href={voteHref ?? antragHref} className="font-display text-l font-semibold underline-offset-4 hover:underline" style={{ overflowWrap: 'anywhere' }}>{title}</a>
      <div className="mt-s flex flex-wrap items-center gap-x-s gap-y-xs text-s caption">
        {statusLabel && (
          <span className={`w-fit border border-current px-s py-[2px] text-[11px] font-semibold ${row.beratungsstand === 'Abgelehnt' ? 'text-danger' : 'opacity-l'}`}>
            {statusLabel}
          </span>
        )}
        {vote && voteHref && (
          <a href={voteHref} className="inline-flex items-center gap-xs opacity-l transition-opacity hover:opacity-100">
            <span
              className="size-[6px] shrink-0"
              style={{ background: vote.result === 'angenommen' ? 'var(--color-success)' : 'var(--color-danger)' }}
            />
            {vote.result === 'angenommen' ? t.accepted : t.rejected} {formatDateShort(vote.date, locale)}
          </a>
        )}
        {row.introducedDate && <span className="opacity-l">{formatDateShort(row.introducedDate, locale)}</span>}
        {row.introducedDate && <span className="opacity-l" aria-hidden="true">·</span>}
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
