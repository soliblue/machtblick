import { cn } from '@/lib/utils'
import type { PartyHistoryPoint, PartyHistoryEvent } from '@/server/getPartyHistory'
import { useCopy, useLocale } from '@/lib/i18n'

type Props = {
  point: PartyHistoryPoint
  partyLabel: string
  partyColor: string
  events: PartyHistoryEvent[]
}

export function PartyHistoryEmpty({ point, partyLabel, partyColor, events }: Props) {
  const founded = events.find((e) => e.type === 'founded')
  const foundedYear = founded ? founded.date.slice(0, 4) : null
  const locale = useLocale()
  const t = useCopy()
  const pct = (point.pctOfTotal * 100).toFixed(1).replace('.', locale === 'de' ? ',' : '.') + '%'
  return (
    <div
      data-slot="card"
      className={cn('flex flex-col gap-6 border bg-card py-6 text-card-foreground shadow-sm', 'gap-l border bg-transparent p-l shadow-none')}
      style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
    >
      <div className="text-center text-m">
        <p className="font-semibold">
          {partyLabel} {t.partyHistoryEmpty.replace('{term}', String(point.termNumber))}
        </p>
        <p className="mt-s opacity-l">
          {t.partyHistorySoon}
        </p>
        {foundedYear ? (
          <p className="mt-s text-s opacity-l">{t.founded} {foundedYear}.</p>
        ) : null}
      </div>
      <div className="flex items-center justify-center gap-s text-m font-semibold">
        <span className="inline-block size-[10px] rounded-full" style={{ background: partyColor }} />
        <span>{t.current} {pct}</span>
        <span className="opacity-l font-regular">
          ({point.seats} {t.of} {point.totalSeats} {t.currentSeats}, {point.termNumber}. {t.termShort})
        </span>
      </div>
    </div>
  )
}
