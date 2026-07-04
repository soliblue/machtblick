import { useEffect, useRef } from 'react'
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
  const panelRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    if (!panel) return
    panel.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const items = panel.querySelectorAll<HTMLElement>('button, a[href]')
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      trigger?.focus()
    }
  }, [])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-fg/40 p-l" role="presentation" onClick={onClose}>
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${t.partySummaryAria} ${label}`}
        tabIndex={-1}
        className="max-h-[85vh] w-[90vw] max-w-[42rem] overflow-y-auto bg-background shadow-xl outline-none"
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
