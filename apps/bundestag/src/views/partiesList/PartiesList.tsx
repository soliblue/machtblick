import { ArrowRight } from 'lucide-react'
import type { PartyListItem } from '@/server/parties'
import { PartyCard } from './PartyCard'
import { Hemicycle } from './Hemicycle'
import { hasPartyLine, isGoverning, partyLabel } from '@/lib/parties'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

type Props = { parties: PartyListItem[] }

export function PartiesList({ parties }: Props) {
  const t = useCopy()
  const locale = useLocale()
  const totalSeats = parties.reduce((a, p) => a + p.seats, 0)
  const governing = parties.filter((p) => hasPartyLine(p.party) && isGoverning(p.party))
  const opposition = parties.filter((p) => hasPartyLine(p.party) && !isGoverning(p.party))
  const fraktionslos = parties.find((p) => p.party === 'fraktionslos')
  const governingSeats = governing.reduce((a, p) => a + p.seats, 0)
  const oppositionSeats = opposition.reduce((a, p) => a + p.seats, 0)
  return (
    <main className="mx-auto max-w-3xl p-l">
      <h1 className="sr-only">{t.navParties}</h1>
      <div className="mb-l">
        <Hemicycle parties={parties} />
      </div>
      <section>
        <h2 className="text-s caption opacity-l">
          {t.government} · <span className="tabular-nums">{t.seatsOfTotal.replace('{sum}', String(governingSeats)).replace('{total}', String(totalSeats))}</span>
        </h2>
        <div className="mt-s flex flex-col">
          {governing.map((p) => (
            <PartyCard key={p.slug} party={p} totalSeats={totalSeats} />
          ))}
        </div>
      </section>
      <section className="mt-l">
        <h2 className="text-s caption opacity-l">
          {t.opposition} · <span className="tabular-nums">{oppositionSeats}</span> {t.seats}
        </h2>
        <div className="mt-s flex flex-col">
          {opposition.map((p) => (
            <PartyCard key={p.slug} party={p} totalSeats={totalSeats} />
          ))}
        </div>
      </section>
      {fraktionslos ? (
        <a
          href={`${withLocale('/members/', locale)}?party=${encodeURIComponent(fraktionslos.party)}`}
          className="mt-l flex w-fit items-center gap-s text-s caption opacity-l transition-opacity hover:opacity-100"
        >
          <span>{partyLabel(fraktionslos.party, locale)} · <span className="tabular-nums">{fraktionslos.seats}</span> {t.seats}</span>
          <ArrowRight size={14} aria-hidden="true" />
        </a>
      ) : null}
    </main>
  )
}
