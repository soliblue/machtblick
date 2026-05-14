import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePartyHistory } from '@/hooks/usePartyHistory'
import { PartyHistoryChart } from './PartyHistoryChart'

type Props = {
  slug: string
  partyLabel: string
  partyColor: string
}

export function PartyHistoryPanel({ slug, partyLabel, partyColor }: Props) {
  const { data, isLoading, error } = usePartyHistory(slug)
  return (
    <div>
      <div className="mb-l flex items-baseline justify-between">
        <div className="text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>
          Anteil am Bundestag
        </div>
        {data && data.points.length > 0 ? (
          <div className="text-s opacity-l">
            {data.points[0].year} - heute
          </div>
        ) : null}
      </div>
      {isLoading ? <Skeleton className="h-[320px] w-full bg-surface" /> : null}
      {error ? (
        <Card className="p-l text-m" style={{ borderColor: 'color-mix(in oklab, var(--color-danger) 40%, transparent)' }}>
          Der Verlauf konnte nicht geladen werden.
        </Card>
      ) : null}
      {data ? (
        <div className="-mx-l">
          <PartyHistoryChart history={data} partyLabel={partyLabel} partyColor={partyColor} />
        </div>
      ) : null}
    </div>
  )
}
