import type { PartyListItem } from '@/server/parties'
import { PartyLogo } from '@/views/votesList/PartyLogo'
import { pct } from '@/lib/format'
import { isGoverning, partyLabel } from '@/lib/parties'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

type Props = { party: PartyListItem; totalSeats: number }

export function PartyCard({ party, totalSeats }: Props) {
  const t = useCopy()
  const locale = useLocale()
  const label = partyLabel(party.party, locale)
  const share = totalSeats > 0 ? Math.round((party.seats / totalSeats) * 100) : 0
  return (
    <div className="relative flex flex-col py-m transition-opacity hover:opacity-80 desk:py-l">
      <a
        href={withLocale(`/parties/${party.slug}/profile/`, locale)}
        className="absolute inset-0 z-10"
        aria-label={`${label}, ${party.seats} ${t.seats}, ${isGoverning(party.party) ? t.government : t.opposition}, ${t.cohesion} ${pct(party.cohesion)}, ${t.attendance} ${pct(party.attendance)}`}
      />
      <div className="flex min-w-0 items-center gap-s">
        <PartyLogo party={party.party} size={20} decorative />
        <span className="truncate text-m font-semibold">{label}</span>
      </div>
      <div className="mt-m flex flex-col desk:flex-row desk:items-baseline desk:gap-s">
        <span className="font-display text-[32px] font-semibold leading-[0.9] tracking-[-0.015em] tabular-nums">{party.seats}</span>
        <span className="mt-xs min-w-0 truncate text-s caption opacity-l desk:mt-0">{t.seats} · <span className="tabular-nums">{share} %</span></span>
      </div>
      <CardStat label={t.cohesion} value={party.cohesion} />
      <CardStat label={t.attendance} value={party.attendance} />
    </div>
  )
}

function CardStat({ label, value }: { label: string; value: number }) {
  return (
    <>
      <span className="mt-m min-w-0 truncate text-s caption opacity-l">{label}</span>
      <div className="mt-xs flex items-center gap-s">
        <div className="h-[3px] min-w-0 flex-1 bg-fg/15">
          <div className="h-full bg-success" style={{ width: pct(value) }} />
        </div>
        <span className="text-s font-semibold tabular-nums">{pct(value)}</span>
      </div>
    </>
  )
}
