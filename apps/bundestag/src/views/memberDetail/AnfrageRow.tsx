import type { AnfrageRow as AnfrageRowData } from '@/server/anfragen'
import { formatDate } from '@/lib/format'
import { Stamp } from '@/views/votesList/Stamp'
import { useLocale } from '@/lib/i18n'

const TYPE_LABEL_FULL: Record<AnfrageRowData['type'], string> = {
  kleine: 'Kleine',
  grosse: 'Große',
  schriftlich: 'Schriftlich',
}

const TYPE_LABEL_FULL_EN: Record<AnfrageRowData['type'], string> = {
  kleine: 'Minor',
  grosse: 'Major',
  schriftlich: 'Written',
}

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

type Props = { row: AnfrageRowData }

export function AnfrageRow({ row }: Props) {
  const locale = useLocale()
  const href = row.questionPdfUrl ?? row.answerPdfUrl ?? undefined
  const answered = row.beratungsstand === 'Beantwortet'
  const Wrap = href ? 'a' : 'div'
  const segments = [
    row.questionDate ? formatDate(row.questionDate) : null,
    locale === 'en' ? TYPE_LABEL_FULL_EN[row.type] : TYPE_LABEL_FULL[row.type],
    row.cosignerCount > 0 ? `+${row.cosignerCount} ${locale === 'en' ? 'cosigners' : 'Mitzeichner'}` : null,
  ].filter((s): s is string => Boolean(s))
  return (
    <Wrap
      {...(href ? { href, target: '_blank', rel: 'noreferrer' } : {})}
      className="flex flex-col border-t py-m transition-opacity hover:opacity-80"
      style={{ borderColor: ROW_BORDER }}
    >
      <span className="text-m font-semibold" style={{ overflowWrap: 'anywhere' }}>{row.title}</span>
      {row.answerRessort ? (
        <span className="mt-xs text-s opacity-l" style={{ overflowWrap: 'anywhere' }}>{row.answerRessort}</span>
      ) : null}
      <div className="mt-s flex flex-wrap items-center justify-between gap-x-m gap-y-s">
        <span className="flex flex-wrap items-center gap-s text-s opacity-l">
          {segments.flatMap((seg, i) => [
            i > 0 ? <span key={`d${i}`}>·</span> : null,
            <span key={`s${i}`} className="whitespace-nowrap">{seg}</span>,
          ])}
        </span>
        <Stamp variant={answered ? 'beantwortet' : 'offen'} size="s" />
      </div>
    </Wrap>
  )
}
