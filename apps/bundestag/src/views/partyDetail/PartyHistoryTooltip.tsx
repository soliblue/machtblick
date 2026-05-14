type TooltipProps = {
  active?: boolean
  payload?: Array<{ payload?: unknown }>
}

type PointPayload = {
  termNumber: number
  termLabel: string
  seats: number
  totalSeats: number
  pctOfTotal: number
  partyNameAtTime: string
}

const border = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

export function PartyHistoryTooltip({ active, payload }: TooltipProps) {
  const point = active && payload && payload[0] ? (payload[0].payload as PointPayload) : null
  if (!point) return null
  const pct = (point.pctOfTotal * 100).toFixed(1).replace('.', ',') + '%'
  return (
    <div
      className="bg-surface p-m text-s"
      style={{ border: `1px solid ${border}`, minWidth: 220 }}
    >
      <div className="text-m font-semibold">{point.termNumber}. Wahlperiode</div>
      <div className="opacity-l">{point.termLabel}</div>
      <div className="mt-s grid grid-cols-[auto_1fr] gap-x-m gap-y-xs">
        <span className="opacity-l">Name damals</span>
        <span>{point.partyNameAtTime}</span>
        <span className="opacity-l">Sitze</span>
        <span>{point.seats} von {point.totalSeats}</span>
        <span className="opacity-l">Anteil</span>
        <span>{pct}</span>
      </div>
    </div>
  )
}
