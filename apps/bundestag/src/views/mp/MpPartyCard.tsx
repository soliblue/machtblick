import type { MpPartyListItem } from '@/server/mpParties'
import type { ParliamentSlug } from '@/lib/parliaments'
import { pct } from '@/lib/format'

type Props = { party: MpPartyListItem; section: ParliamentSlug; totalSeats: number }

export function MpPartyCard({ party, section, totalSeats }: Props) {
  const share = totalSeats > 0 ? Math.round((party.seats / totalSeats) * 100) : 0
  return (
    <div className="relative flex flex-col border border-fg/15 bg-background p-l transition-opacity hover:opacity-80">
      <a href={`/${section}/parties/${party.slug}/`} className="absolute inset-0 z-10" aria-label={`${party.label}, ${party.seats} Sitze, Geschlossenheit ${pct(party.cohesion)}, Anwesenheit ${pct(party.attendance)}`} />
      <span className="truncate text-m font-semibold">{party.label}</span>
      <div className="mt-m flex items-baseline gap-s">
        <span className="font-display text-[32px] font-semibold leading-[0.9] tracking-[-0.015em] tabular-nums">{party.seats}</span>
        <span className="min-w-0 truncate text-s caption opacity-l">Sitze · <span className="tabular-nums">{share} %</span></span>
      </div>
      <MpStat label="Geschlossenheit" value={party.cohesion} />
      <MpStat label="Anwesenheit" value={party.attendance} />
    </div>
  )
}

function MpStat({ label, value }: { label: string; value: number }) {
  return (
    <>
      <span className="mt-m truncate text-s caption opacity-l">{label}</span>
      <div className="mt-xs flex items-center gap-s">
        <div className="h-[3px] min-w-0 flex-1 bg-fg/15">
          <div className="h-full bg-success" style={{ width: pct(value) }} />
        </div>
        <span className="text-s font-semibold tabular-nums">{pct(value)}</span>
      </div>
    </>
  )
}
