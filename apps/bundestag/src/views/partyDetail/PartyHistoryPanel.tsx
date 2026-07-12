import { Suspense, lazy } from 'react'
import type { PartyHistory } from '@/server/getPartyHistory'
import { dedupePoints, toChartPoints } from './partyHistoryPoints'
import { useCopy, useLocale } from '@/lib/i18n'

const PartyHistoryChart = lazy(() => import('./PartyHistoryChart').then((m) => ({ default: m.PartyHistoryChart })))

type Props = {
  history: PartyHistory
  partyLabel: string
  partyColor: string
}

export function PartyHistoryPanel({ history, partyLabel, partyColor }: Props) {
  const t = useCopy()
  const locale = useLocale()
  const data = toChartPoints(dedupePoints(history.points), t.sinceToday)
  return (
    <div>
      <div className="mb-l flex items-baseline justify-between">
        <div className="text-s caption opacity-l">
          {t.shareOfBundestag}
        </div>
        {history.points.length > 0 ? (
          <div className="text-s opacity-l">
            {history.points[0].year} - {t.sinceToday}
          </div>
        ) : null}
      </div>
      {data.length > 1 && (
        <ul className="sr-only" aria-label={t.shareOfBundestagByTerm}>
          {data.map((d) => (
            <li key={d.termNumber}>
              {d.termLabel}: {d.pctValue.toFixed(1).replace('.', locale === 'de' ? ',' : '.')}%
            </li>
          ))}
        </ul>
      )}
      <div className="-mx-l">
        <Suspense fallback={<div style={{ height: data.length > 1 ? 320 : undefined }} />}>
          <PartyHistoryChart history={history} partyLabel={partyLabel} partyColor={partyColor} />
        </Suspense>
      </div>
    </div>
  )
}
