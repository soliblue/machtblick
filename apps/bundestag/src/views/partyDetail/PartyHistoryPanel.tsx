import type { PartyHistory } from '@/server/getPartyHistory'
import { PartyHistoryChart } from './PartyHistoryChart'
import { useCopy } from '@/lib/i18n'

type Props = {
  history: PartyHistory
  partyLabel: string
  partyColor: string
}

export function PartyHistoryPanel({ history, partyLabel, partyColor }: Props) {
  const t = useCopy()
  return (
    <div>
      <div className="mb-l flex items-baseline justify-between">
        <div className="text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>
          {t.shareOfBundestag}
        </div>
        {history.points.length > 0 ? (
          <div className="text-s opacity-l">
            {history.points[0].year} - {t.sinceToday}
          </div>
        ) : null}
      </div>
      <div className="-mx-l">
        <PartyHistoryChart history={history} partyLabel={partyLabel} partyColor={partyColor} />
      </div>
    </div>
  )
}
