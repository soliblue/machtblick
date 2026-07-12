import { memo, type Ref } from 'react'
import type { VoteListItem } from '@/server/votes'
import { useLocale } from '@/lib/i18n'
import { partyLabel } from '@/lib/parties'
import { partiesByJaShare } from './deriveDek'
import { VoteDistributionDonut } from './VoteDistributionDonut'

type Props = {
  partySummaries: VoteListItem['partySummaries']
  highlight?: { party: string; color: string; targetRef?: Ref<HTMLDivElement> }
}

export const PartyDonutRow = memo(function PartyDonutRow({ partySummaries, highlight }: Props) {
  const locale = useLocale()
  const parties = partiesByJaShare(partySummaries)
  return (
    <div
      className={highlight ? 'grid w-full items-start gap-s pt-xl' : 'flex w-full items-start justify-between gap-s'}
      style={highlight ? { gridTemplateColumns: `repeat(${parties.length}, minmax(0, 1fr))` } : undefined}
    >
      {parties.map((p) => {
        const highlighted = p.party === highlight?.party
        return (
          <div key={p.party} className="relative flex min-w-0 flex-col items-center gap-xs">
            <div
              ref={highlighted ? highlight?.targetRef : undefined}
              className={highlight ? 'flex size-14 items-center justify-center rounded-full' : undefined}
              style={highlight && highlighted ? { boxShadow: `0 0 0 2px color-mix(in oklab, ${highlight.color} 70%, transparent)` } : undefined}
            >
              <VoteDistributionDonut yes={p.yes} no={p.no} abstain={p.abstain} absent={p.absent} size={highlight ? 46 : 52} />
            </div>
            <span
              className={`max-w-full truncate text-[9px] uppercase ${p.position === 'mixed' ? 'font-semibold' : 'opacity-l'}`}
              style={{ letterSpacing: '0.06em' }}
            >
              {partyLabel(p.party, locale)}
            </span>
          </div>
        )
      })}
    </div>
  )
})
