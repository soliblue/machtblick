import { useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { PARTY_LOGO, PARTY_ORDER, partyLabel } from '@/lib/parties'
import { PartyLogo } from '@/views/votesList/PartyLogo'
import { PartySummaryModal, type PartySummary } from './PartySummaryModal'
import { useCopy, useLocale } from '@/lib/i18n'

type Props = {
  summaries: PartySummary[]
}

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

export function PartySummaryPreviewList({ summaries }: Props) {
  const [active, setActive] = useState<PartySummary | null>(null)
  const t = useCopy()
  const locale = useLocale()
  const available = useMemo(() => {
    const byParty = new Map(summaries.filter((s) => s.positionSummary).map((s) => [s.party, s]))
    const ordered = PARTY_ORDER.map((p) => byParty.get(p)).filter((s): s is PartySummary => Boolean(s))
    const seen = new Set(ordered.map((s) => s.party))
    return [...ordered, ...summaries.filter((s) => s.positionSummary && !seen.has(s.party))]
  }, [summaries])
  return available.length > 0 ? (
    <section className="mb-l">
      <div className="mb-s text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>
        {t.partySummaries}
      </div>
      <div className="mb-m bg-surface p-m text-s">{t.partySummaryIntro}</div>
      <div>
        {available.map((s, index) => {
          const label = partyLabel(s.party, locale)
          return (
            <button
              key={s.party}
              type="button"
              onClick={() => setActive(s)}
              aria-label={`${t.openPartySummary} ${label}`}
              className={index === 0
                ? 'flex w-full items-center gap-m pb-m text-left outline-none transition-colors hover:bg-surface focus-visible:bg-surface'
                : 'flex w-full items-center gap-m border-t py-m text-left outline-none transition-colors hover:bg-surface focus-visible:bg-surface'}
              style={{ borderColor: ROW_BORDER }}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-xs">
                <span className="flex min-w-0 items-center gap-s">
                  {PARTY_LOGO[s.party]
                    ? <PartyLogo party={s.party} size={20} decorative />
                    : <span className="truncate text-m font-semibold">{label}</span>}
                </span>
                <span className="line-clamp-2 text-m opacity-l">{s.positionSummary?.replace(/\s+/g, ' ').trim()}</span>
              </span>
              <ChevronRight size={17} className="shrink-0 opacity-l" />
            </button>
          )
        })}
      </div>
      {active && <PartySummaryModal summary={active} onClose={() => setActive(null)} />}
    </section>
  ) : null
}
