import { Card } from '@/components/ui/card'
import type { PartyHistoryPoint, PartyHistoryEvent } from '@/server/getPartyHistory'

type Props = {
  point: PartyHistoryPoint
  partyLabel: string
  partyColor: string
  events: PartyHistoryEvent[]
}

export function PartyHistoryEmpty({ point, partyLabel, partyColor, events }: Props) {
  const founded = events.find((e) => e.type === 'founded')
  const foundedYear = founded ? founded.date.slice(0, 4) : null
  const pct = (point.pctOfTotal * 100).toFixed(1).replace('.', ',') + '%'
  return (
    <Card className="gap-l border bg-transparent p-l shadow-none" style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}>
      <div className="text-center text-m">
        <p className="font-semibold">
          {partyLabel} sitzt erst seit der {point.termNumber}. Wahlperiode im Bundestag.
        </p>
        <p className="mt-s opacity-l">
          Ein Verlauf wird sichtbar, sobald mindestens zwei Wahlperioden erfasst sind.
        </p>
        {foundedYear ? (
          <p className="mt-s text-s opacity-l">Gegründet {foundedYear}.</p>
        ) : null}
      </div>
      <div className="flex items-center justify-center gap-s text-m font-semibold">
        <span className="inline-block size-[10px] rounded-full" style={{ background: partyColor }} />
        <span>Aktuell {pct}</span>
        <span className="opacity-l font-regular">
          ({point.seats} von {point.totalSeats} Sitzen, {point.termNumber}. WP)
        </span>
      </div>
    </Card>
  )
}
