import type { AnfrageRow as AnfrageRowData } from '@/server/anfragen'
import { formatDate } from '@/lib/format'

const TYPE_LABEL: Record<AnfrageRowData['type'], string> = {
  kleine: 'KL',
  grosse: 'GR',
  schriftlich: 'SF',
}

const TYPE_TITLE: Record<AnfrageRowData['type'], string> = {
  kleine: 'Kleine Anfrage',
  grosse: 'Große Anfrage',
  schriftlich: 'Schriftliche Frage',
}

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

type Props = { row: AnfrageRowData }

export function AnfrageRow({ row }: Props) {
  const href = row.questionPdfUrl ?? row.answerPdfUrl ?? undefined
  const answered = row.beratungsstand === 'Beantwortet'
  const statusColor = answered ? 'var(--color-success)' : 'var(--color-danger)'
  const Wrap = href ? 'a' : 'div'
  return (
    <Wrap
      {...(href ? { href, target: '_blank', rel: 'noreferrer' } : {})}
      className="grid grid-cols-[1fr_auto_auto_auto] items-start gap-m border-t py-s transition-opacity hover:opacity-80"
      style={{ borderColor: ROW_BORDER }}
    >
      <div className="flex flex-col gap-xs">
        <span className="text-m font-semibold">{row.title}</span>
        <span className="text-s opacity-l">
          {row.answerRessort ? row.answerRessort : null}
          {row.answerRessort && row.cosignerCount > 0 ? ' · ' : null}
          {row.cosignerCount > 0 ? <>+{row.cosignerCount} Mitzeichner</> : null}
        </span>
      </div>
      <span className="w-24 pt-xs text-s opacity-l tabular-nums">{row.questionDate ? formatDate(row.questionDate) : ''}</span>
      <span
        className="w-16 px-s py-xs text-s font-semibold tabular-nums"
        title={TYPE_TITLE[row.type]}
        style={{ background: 'color-mix(in oklab, var(--color-fg) 8%, transparent)' }}
      >
        {TYPE_LABEL[row.type]}
      </span>
      <span className="w-24 pt-xs text-s font-semibold" style={{ color: statusColor }}>
        {answered ? 'Beantwortet' : 'Offen'}
      </span>
    </Wrap>
  )
}
