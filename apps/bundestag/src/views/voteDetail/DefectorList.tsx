import { DefectorRow } from './DefectorRow'
import type { MemberVoteRow } from '@/server/members'

type Defectors = Array<{
  party: string
  majority: string
  count: number
  members: Array<{ id: string; name: string; choice: string; pictureUrl: string | null }>
}>

type Props = { defectors: Defectors }

export function DefectorList({ defectors }: Props) {
  if (!defectors.length) {
    return <div className="text-m opacity-l">Keine Abweichler.</div>
  }
  return (
    <div className="flex flex-col">
      {defectors.flatMap((d) =>
        d.members.map((m) => (
          <DefectorRow
            key={m.id}
            id={m.id}
            name={m.name}
            choice={m.choice as MemberVoteRow['choice']}
            pictureUrl={m.pictureUrl}
            party={d.party}
          />
        )),
      )}
    </div>
  )
}
