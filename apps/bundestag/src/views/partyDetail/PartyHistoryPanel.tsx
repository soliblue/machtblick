import type { PartyHistory } from '@/server/getPartyHistory'
import { PartyHistoryChart } from './PartyHistoryChart'

type Props = {
  history: PartyHistory
  partyLabel: string
  partyColor: string
}

export function PartyHistoryPanel({ history, partyLabel, partyColor }: Props) {
  return (
    <div>
      <div className="mb-l flex items-baseline justify-between">
        <div className="text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>
          Anteil am Bundestag
        </div>
        {history.points.length > 0 ? (
          <div className="text-s opacity-l">
            {history.points[0].year} - heute
          </div>
        ) : null}
      </div>
      <div className="-mx-l">
        <PartyHistoryChart history={history} partyLabel={partyLabel} partyColor={partyColor} />
      </div>
    </div>
  )
}
