import { ChevronRight } from 'lucide-react'
import { PARTY_LOGO, partyLabel } from '@/lib/parties'
import { PartyLogo } from '@/views/votesList/PartyLogo'
import { Stamp, type StanceStampVariant } from '@/views/votesList/Stamp'
import { SERIF } from '@/lib/fonts'
import { MarkdownInline } from '@/lib/MarkdownInline'
import type { Stance } from '@/views/speeches/StanceText'
import { useCopy, useLocale } from '@/lib/i18n'

export type PartySummary = {
  party: string
  positionSummary?: string | null
  keyPoints?: string | null
  dissentNote?: string | null
}

export type SummaryRow = PartySummary & { yes: number; no: number; abstain: number }

type Props = {
  summaries: SummaryRow[]
  onOpen: (index: number) => void
}

export const stanceOf = (s: SummaryRow): Stance =>
  s.abstain > s.yes && s.abstain > s.no ? 'abstain' : s.yes > s.no ? 'yes' : s.no > s.yes ? 'no' : 'split'

const STANCE_STAMP: Record<Stance, StanceStampVariant> = { yes: 'dafuer', no: 'dagegen', abstain: 'enthalten', split: 'gespalten' }

export function PartySummaryPreviewList({ summaries, onOpen }: Props) {
  const t = useCopy()
  const locale = useLocale()
  return summaries.length > 0 ? (
    <section className="mb-l">
      <div className="mb-s text-s caption opacity-l">
        {t.partySummaries} · {summaries.length} {t.groupsCount}
      </div>
      <div className="-mx-l flex gap-m overflow-x-auto px-l pb-m pt-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {summaries.map((s, index) => {
          const label = partyLabel(s.party, locale)
          return (
            <button
              key={s.party}
              type="button"
              onClick={() => onOpen(index)}
              aria-label={`${t.openPartySummary} ${label}`}
              className="flex w-[240px] flex-none flex-col border border-fg/15 bg-background p-l text-left outline-none transition-colors hover:bg-surface focus-visible:bg-surface"
            >
              <span className="flex w-full items-center justify-between gap-m">
                {PARTY_LOGO[s.party]
                  ? <PartyLogo party={s.party} size={20} decorative />
                  : <span className="truncate text-m font-semibold">{label}</span>}
                <Stamp variant={STANCE_STAMP[stanceOf(s)]} size="s" rotated={false} />
              </span>
              <span className="mt-s line-clamp-5 text-m" style={{ fontFamily: SERIF, lineHeight: 1.45 }}>
                <MarkdownInline>{s.positionSummary ?? ''}</MarkdownInline>
              </span>
              <span className="mt-m flex w-full items-center justify-between text-s opacity-l">
                <span>{t.readSummary}</span>
                <ChevronRight size={17} className="shrink-0" aria-hidden="true" />
              </span>
            </button>
          )
        })}
      </div>
    </section>
  ) : null
}
