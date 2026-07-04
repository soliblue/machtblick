import type { VoteListItem } from '@/server/votes'
import { useLocale } from '@/lib/i18n'
import { partyLabel } from '@/lib/parties'
import { partiesByJaShare } from './deriveDek'
import { VoteDistributionDonut } from './VoteDistributionDonut'

type Props = { partySummaries: VoteListItem['partySummaries'] }

export function PartyDonutRow({ partySummaries }: Props) {
  const locale = useLocale()
  return (
    <div className="flex w-full items-start justify-between gap-s">
      {partiesByJaShare(partySummaries).map((p) => (
        <div key={p.party} className="flex min-w-0 flex-col items-center gap-xs">
          <VoteDistributionDonut yes={p.yes} no={p.no} abstain={p.abstain} absent={p.absent} size={52} />
          <span
            className={`max-w-full truncate text-[9px] uppercase ${p.position === 'mixed' ? 'font-semibold' : 'opacity-l'}`}
            style={{ letterSpacing: '0.06em' }}
          >
            {partyLabel(p.party, locale)}
          </span>
        </div>
      ))}
    </div>
  )
}
