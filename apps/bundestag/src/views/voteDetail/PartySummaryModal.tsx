import { X } from 'lucide-react'
import { Markdown } from '@/lib/Markdown'
import { partyLabel } from '@/lib/parties'
import { PartyLogo } from '@/views/votesList/PartyLogo'
import { useCopy, useLocale } from '@/lib/i18n'

export type PartySummary = {
  party: string
  positionSummary?: string | null
  keyPoints?: string | null
  dissentNote?: string | null
}

type Props = {
  summary: PartySummary
  onClose: () => void
}

export function PartySummaryModal({ summary, onClose }: Props) {
  const t = useCopy()
  const locale = useLocale()
  const label = partyLabel(summary.party, locale)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-fg/40 p-l" role="presentation" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${t.partySummaryAria} ${label}`}
        className="max-h-[85vh] w-[90vw] max-w-[42rem] overflow-y-auto bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 mb-l flex items-start justify-between gap-m bg-background p-l pb-m">
          <div className="flex min-w-0 items-center gap-m">
            <PartyLogo party={summary.party} size={28} decorative />
            <h2 className="text-xl font-semibold">{label}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={t.close} className="shrink-0 p-xs opacity-l hover:opacity-100">
            <X size={19} />
          </button>
        </div>
        <div className="px-l pb-l">
          {summary.positionSummary && <p className="text-m leading-relaxed whitespace-pre-line">{summary.positionSummary}</p>}
          {summary.keyPoints && (
            <div className="mt-l">
              <Markdown>{summary.keyPoints}</Markdown>
            </div>
          )}
          {summary.dissentNote && <p className="mt-l text-s opacity-l">{summary.dissentNote}</p>}
          <p className="mt-l border-t pt-m text-s opacity-l" style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}>
            {t.partySummaryNotice}
          </p>
        </div>
      </section>
    </div>
  )
}
