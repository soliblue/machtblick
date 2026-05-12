import { Link } from '../../lib/Link'
import { PARTY_LABEL } from '@/lib/parties'

const CHOICE_LABEL: Record<string, string> = {
  ja: 'Ja',
  nein: 'Nein',
  enthalten: 'Enthalten',
  nicht_abgegeben: 'Nicht abgegeben',
}

type Defectors = Array<{
  party: string
  majority: string
  count: number
  members: Array<{ id: string; name: string; choice: string }>
}>

type Props = { defectors: Defectors }

export function DefectorList({ defectors }: Props) {
  if (!defectors.length) {
    return <div className="text-m opacity-l">Keine Abweichler.</div>
  }
  return (
    <div className="flex flex-col gap-m">
      {defectors.map((d) => (
        <div
          key={d.party}
          className=" bg-surface p-m"
          style={{ border: '1px solid color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
        >
          <div className="mb-s text-m font-semibold">
            {d.count} {PARTY_LABEL[d.party] ?? d.party} gegen Linie ({CHOICE_LABEL[d.majority]})
          </div>
          <div className="flex flex-wrap gap-x-m gap-y-xs text-s">
            {d.members.map((m) => (
              <Link key={m.id} to="/members/$id/" params={{ id: m.id }} className="opacity-l hover:opacity-100">
                {m.name} ({CHOICE_LABEL[m.choice]})
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
