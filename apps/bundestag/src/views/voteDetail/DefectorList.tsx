import { DefectorRow } from './DefectorRow'
import type { MemberVoteRow } from '@/server/members'
import { useCopy } from '@/lib/i18n'

type Defectors = Array<{
  party: string
  majority: string
  count: number
  members: Array<{ id: string; name: string; choice: string; pictureUrl: string | null }>
}>

type Props = { defectors: Defectors }

export function DefectorList({ defectors }: Props) {
  const t = useCopy()
  if (!defectors.length) {
    return <div className="text-m opacity-l">{t.noDefectors}</div>
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
