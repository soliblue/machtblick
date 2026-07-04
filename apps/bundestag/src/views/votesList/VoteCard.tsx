import type { VoteListItem } from '@/server/votes'
import { formatDateShort } from '@/lib/format'
import { SERIF } from '@/lib/fonts'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'
import { MarkdownInline } from '@/lib/MarkdownInline'
import { PartyBadge } from './PartyBadge'
import { VoteHemicycle } from './VoteHemicycle'
import { PartyDonutRow } from './PartyDonutRow'
import { deriveDescription } from './deriveDek'
import { useFittedLineClamp } from '@/hooks/useFittedLineClamp'


type Props = { vote: VoteListItem }

export function VoteCard({ vote }: Props) {
  const locale = useLocale()
  const t = useCopy()
  const { ref: summaryRef, lines: summaryLines } = useFittedLineClamp<HTMLDivElement>()
  const accepted = vote.result === 'angenommen'
  return (
    <article
      className="group relative flex h-full flex-col border border-fg/15 bg-background p-l shadow-[0_1px_3px_rgba(10,10,10,0.08),0_6px_16px_rgba(10,10,10,0.07)] desk:grid desk:h-auto desk:grid-cols-[minmax(0,1fr)_280px] desk:gap-x-xl"
      style={{ borderTop: `3px solid ${accepted ? 'var(--color-success)' : 'var(--color-danger)'}` }}
    >
      <a
        href={withLocale(`/votes/${vote.id}/`, locale)}
        className="absolute inset-0"
        aria-label={[vote.cleanTitle, accepted ? t.accepted : t.rejected, `${t.yes} ${vote.yes}`, `${t.no} ${vote.no}`, `${t.abstention} ${vote.abstain}`, ...(vote.absent === null ? [] : [`${t.absentLabel} ${vote.absent}`])].join(' · ')}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-[1] flex h-[22px] -translate-x-1/2 -translate-y-1/2 items-center justify-center px-xl text-[11px] font-semibold uppercase leading-none text-white"
        style={{ letterSpacing: '0.14em', textIndent: '0.14em', background: accepted ? 'var(--color-success)' : 'var(--color-danger)' }}
      >
        {accepted ? t.accepted : t.rejected}
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <p className="mt-s flex min-w-0 items-center gap-s overflow-hidden text-s caption">
          <span className="min-w-0 truncate">
            <PartyBadge party={vote.proposingParty} compact logoSize={17} />
          </span>
          <span className="opacity-m">·</span>
          <span className="shrink-0 whitespace-nowrap opacity-l">{formatDateShort(vote.date, locale)}</span>
        </p>
        <h2
          lang={locale}
          className="mt-m line-clamp-4 font-display text-xl font-semibold leading-[1.15] decoration-1 underline-offset-[3px] group-hover:underline"
          style={{ textWrap: 'pretty' }}
        >
          {vote.cleanTitle}
        </h2>
        <div ref={summaryRef} data-clamp-summary className="relative mt-m min-h-0 flex-1 overflow-hidden text-m leading-[1.45] desk:pointer-events-none">
          <p
            className="desk:pointer-events-none desk:absolute desk:inset-0"
            style={{
              fontFamily: SERIF,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: summaryLines ?? undefined,
              maxHeight: 'round(down, 100%, 1lh)',
              overflow: 'hidden',
            }}
          >
            {vote.summarySimplified ? <MarkdownInline>{vote.summarySimplified}</MarkdownInline> : deriveDescription(vote, locale)}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-l pt-m desk:pt-0">
        <VoteHemicycle yes={vote.yes} no={vote.no} abstain={vote.abstain} absent={vote.absent} totalMembers={vote.totalMembers} />
        <div className="w-full desk:max-w-[320px]">
          <PartyDonutRow partySummaries={vote.partySummaries} />
        </div>
      </div>
    </article>
  )
}
