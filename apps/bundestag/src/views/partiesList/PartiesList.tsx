import type { PartyListItem } from '@/server/parties'
import { PartyRow } from './PartyRow'
import { Hemicycle } from './Hemicycle'

type Props = { parties: PartyListItem[] }

export function PartiesList({ parties }: Props) {
  return (
    <main className="mx-auto max-w-3xl p-l">
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
