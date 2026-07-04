import { useMemo, useState, type CSSProperties } from 'react'
import { ChevronRight } from 'lucide-react'
import { PARTY_LOGO, PARTY_ORDER, partyLabel } from '@/lib/parties'
import { PartyLogo } from '@/views/votesList/PartyLogo'
import { SERIF } from '@/lib/fonts'
import { MarkdownInline } from '@/lib/MarkdownInline'
import { PartySummaryModal, type PartySummary } from './PartySummaryModal'
import { useCopy, useLocale } from '@/lib/i18n'

export type SummaryRow = PartySummary & { yes: number; no: number; abstain: number }

type Props = {
  summaries: SummaryRow[]
}

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

const STANCE_STYLE: Record<'yes' | 'no' | 'abstain' | 'split', CSSProperties> = {
  yes: { background: 'var(--color-success)', color: 'white' },
  no: { background: 'var(--color-danger)', color: 'white' },
  abstain: { background: 'var(--color-yellow)', color: 'black' },
  split: { border: '1px solid var(--color-fg)', color: 'var(--color-fg)', background: 'transparent' },
}

const stanceOf = (s: SummaryRow) =>
  s.abstain > s.yes && s.abstain > s.no ? 'abstain' : s.yes > s.no ? 'yes' : s.no > s.yes ? 'no' : 'split'

export function PartySummaryPreviewList({ summaries }: Props) {
  const [active, setActive] = useState<SummaryRow | null>(null)
  const t = useCopy()
  const locale = useLocale()
  const available = useMemo(() => {
    const byParty = new Map(summaries.filter((s) => s.positionSummary).map((s) => [s.party, s]))
    const ordered = PARTY_ORDER.map((p) => byParty.get(p)).filter((s): s is SummaryRow => Boolean(s))
    const seen = new Set(ordered.map((s) => s.party))
    return [...ordered, ...summaries.filter((s) => s.positionSummary && !seen.has(s.party))]
  }, [summaries])
  return available.length > 0 ? (
    <section className="mb-l">
      <div className="mb-s text-s caption opacity-l">
        {t.partySummaries}
      </div>
      <p className="mb-m text-s opacity-l">{t.partySummaryIntro}</p>
      <div>
        {available.map((s, index) => {
          const label = partyLabel(s.party, locale)
          const stance = stanceOf(s)
          return (
            <button
              key={s.party}
              type="button"
              onClick={() => setActive(s)}
              aria-label={`${t.openPartySummary} ${label}`}
              className={index === 0
                ? 'flex w-full flex-col pb-m text-left outline-none transition-colors hover:bg-surface focus-visible:bg-surface'
                : 'flex w-full flex-col border-t py-m text-left outline-none transition-colors hover:bg-surface focus-visible:bg-surface'}
              style={{ borderColor: ROW_BORDER }}
            >
              <span className="flex w-full items-center gap-m">
                {PARTY_LOGO[s.party]
                  ? <PartyLogo party={s.party} size={20} decorative />
                  : <span className="truncate text-m font-semibold">{label}</span>}
                <span
                  className="flex h-[20px] items-center px-s text-[11px] font-semibold uppercase leading-none"
                  style={{ letterSpacing: '0.14em', textIndent: '0.14em', ...STANCE_STYLE[stance] }}
                >
                  {t.stanceLabels[stance]}
                </span>
                <ChevronRight size={17} className="ml-auto shrink-0 opacity-l" />
              </span>
              <span className="mt-s line-clamp-3 text-m" style={{ fontFamily: SERIF, lineHeight: 1.45 }}>
                <MarkdownInline>{s.positionSummary ?? ''}</MarkdownInline>
              </span>
            </button>
          )
        })}
      </div>
      {active && <PartySummaryModal summary={active} onClose={() => setActive(null)} />}
    </section>
  ) : null
}
