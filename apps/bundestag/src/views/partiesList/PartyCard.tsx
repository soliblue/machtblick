import type { PartyListItem } from '@/server/parties'
import { pct } from '@/lib/format'
import { isGoverning, partyLabel, PARTY_COLOR } from '@/lib/parties'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

type Props = { party: PartyListItem; totalSeats: number }
const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

export function PartyCard({ party, totalSeats }: Props) {
  const t = useCopy()
  const locale = useLocale()
  const label = partyLabel(party.party, locale)
  const share = totalSeats > 0 ? Math.round((party.seats / totalSeats) * 100) : 0
  return (
    <a
      href={withLocale(`/parties/${party.slug}/`, locale)}
      className="grid grid-cols-[120px_1px_minmax(0,1fr)] gap-m border-b py-m transition-opacity hover:opacity-80"
      style={{ borderColor: ROW_BORDER }}
      aria-label={`${label}, ${party.seats} ${t.seats}, ${isGoverning(party.party) ? t.government : t.opposition}, ${t.cohesion} ${pct(party.cohesion)}, ${t.attendance} ${pct(party.attendance)}`}
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-s">
          <span className="size-[10px] shrink-0 rounded-full" style={{ background: PARTY_COLOR[party.party] ?? 'var(--color-gray)' }} />
          <span className="truncate text-m font-semibold">{label}</span>
        </div>
        <div className="mt-s font-display text-[32px] font-semibold leading-none tabular-nums">{party.seats}</div>
        <div className="mt-xs text-s caption opacity-l">{t.seats}</div>
      </div>
      <div className="bg-fg/15" />
      <div className="min-w-0">
        <div className="text-s caption opacity-l">{t.seats} / <span className="tabular-nums">{share} %</span></div>
        <CardStat label={t.cohesion} value={party.cohesion} />
        <CardStat label={t.attendance} value={party.attendance} />
      </div>
    </a>
  )
}

function CardStat({ label, value }: { label: string; value: number }) {
  return (
    <>
      <span className="mt-m block min-w-0 truncate text-s caption opacity-l">{label}</span>
      <div className="mt-xs flex items-center gap-s">
        <div className="h-[3px] min-w-0 flex-1 bg-fg/15">
          <div className="h-full bg-success" style={{ width: pct(value) }} />
        </div>
        <span className="text-s font-semibold tabular-nums">{pct(value)}</span>
      </div>
    </>
  )
}
