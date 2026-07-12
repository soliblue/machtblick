import { useCopy, useLocale } from '@/lib/i18n'

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

export function PartyHistoryTooltip({ active, payload }: TooltipProps) {
  const locale = useLocale()
  const t = useCopy()
  const point = active && payload && payload[0] ? (payload[0].payload as PointPayload) : null
  if (!point) return null
  const pct = (point.pctOfTotal * 100).toFixed(1).replace('.', locale === 'de' ? ',' : '.') + '%'
  return (
    <div
      className="rounded-m bg-surface p-m text-s"
      style={{ border: '1px solid color-mix(in oklab, var(--color-fg) 15%, transparent)', minWidth: 220 }}
    >
      <div className="text-m font-semibold">{point.termNumber}. {t.electoralTerm}</div>
      <div className="opacity-l">{point.termLabel}</div>
      <div className="mt-s grid grid-cols-[auto_1fr] gap-x-m gap-y-xs">
        <span className="opacity-l">{t.nameAtTime}</span>
        <span>{point.partyNameAtTime}</span>
        <span className="opacity-l">{t.seats}</span>
        <span>{point.seats} {t.of} {point.totalSeats}</span>
        <span className="opacity-l">{t.share}</span>
        <span>{pct}</span>
      </div>
    </div>
  )
}
