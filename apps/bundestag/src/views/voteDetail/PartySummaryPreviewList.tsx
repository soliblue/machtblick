import type { CSSProperties } from 'react'
import { hasPartyLine, PARTY_COLOR, PARTY_LOGO, PARTY_SLUG, partyLabel } from '@/lib/parties'
import { PartyLogo } from '@/views/votesList/PartyLogo'
import { SERIF } from '@/lib/fonts'
import { MarkdownInline } from '@/components/MarkdownInline'
import { withLocale } from '@/lib/locale'
import { AvatarPile, type AvatarPilePerson } from '@/views/speeches/AvatarPile'
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
  speakersByParty?: Map<string, AvatarPilePerson[]>
}

export function PartySummaryPreviewList({ summaries, speakersByParty }: Props) {
  const locale = useLocale()
  const t = useCopy()
  return summaries.length > 0 ? (
    <section className="mb-l">
      <div className="mb-s text-s caption opacity-l">
        {t.partySummaries} · {summaries.length}
      </div>
      <div className="scroll-rail -mx-l overflow-x-auto pb-m pt-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max items-stretch gap-m px-l">
          {summaries.map((s) => {
            const label = partyLabel(s.party, locale)
            const color = PARTY_COLOR[s.party] ?? 'var(--color-fg)'
            const logo = PARTY_LOGO[s.party]
              ? <PartyLogo party={s.party} size={26} decorative />
              : <span className="text-l font-semibold" style={{ color }}>{label}</span>
            return (
              <article
                key={s.party}
                className={`${hasPartyLine(s.party) ? 'party-surface' : 'party-surface-neutral'} flex w-[320px] flex-none flex-col rounded-m p-m desk:w-[400px]`}
                style={{
                  '--party-color': color,
                } as CSSProperties}
              >
                <div className="flex items-center justify-between gap-s">
                  {PARTY_SLUG[s.party] ? (
                    <a href={withLocale(`/parties/${PARTY_SLUG[s.party]}/`, locale)} aria-label={label} className="hover:opacity-80">
                      {logo}
                    </a>
                  ) : (
                    logo
                  )}
                  <AvatarPile people={speakersByParty?.get(s.party) ?? []} />
                </div>
                <div className="mt-s text-l" style={{ fontFamily: SERIF, lineHeight: 1.45 }}>
                  <MarkdownInline>{s.positionSummary ?? ''}</MarkdownInline>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  ) : null
}
