import type { MpPartyListItem } from '@/server/mpParties'
import type { ParliamentSlug } from '@/lib/parliaments'
import { MpSectionNav } from './MpSectionNav'
import { MpPartyCard } from './MpPartyCard'
import { MpEmpty } from './MpEmpty'

type Props = { section: ParliamentSlug; parties: MpPartyListItem[] }

export function MpPartiesList({ section, parties }: Props) {
  const totalSeats = parties.reduce((a, p) => a + p.seats, 0)
  return (
    <>
      <MpSectionNav section={section} active="parties" />
      {parties.length === 0 ? (
        <MpEmpty>Noch keine Fraktionen geladen.</MpEmpty>
      ) : (
        <main className="mx-auto max-w-3xl px-l py-l">
          <div className="grid grid-cols-1 gap-m sm:grid-cols-2 md:grid-cols-3">
            {parties.map((p) => (
              <MpPartyCard key={p.slug} party={p} section={section} totalSeats={totalSeats} />
            ))}
          </div>
        </main>
      )}
    </>
  )
}
