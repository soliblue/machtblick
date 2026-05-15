import type { PartyListItem } from '@/server/parties'
import { PartyRow } from './PartyRow'
import { Hemicycle } from './Hemicycle'
import { useCopy } from '@/lib/i18n'

type Props = { parties: PartyListItem[] }

export function PartiesList({ parties }: Props) {
  const t = useCopy()
  return (
    <main className="mx-auto max-w-3xl p-l">
      <h1 className="sr-only">{t.navParties}</h1>
      <div className="mb-xl">
        <Hemicycle parties={parties} />
      </div>
      <div className="flex flex-col">
        {parties.map((p) => (
          <PartyRow key={p.slug} party={p} />
        ))}
      </div>
    </main>
  )
}
