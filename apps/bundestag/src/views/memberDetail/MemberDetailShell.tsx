import type { ReactNode } from 'react'
import { CalendarCheck, Heart, Vote, UserX } from 'lucide-react'
import type { MemberDetail as MemberDetailData } from '@/server/members'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { pct } from '@/lib/format'
import { StatTiles } from './StatTiles'
import { MemberDetailTabs } from './MemberDetailTabs'

type Props = {
  data: MemberDetailData
  children: ReactNode
}

export function MemberDetailShell({ data, children }: Props) {
  const tiles = [
    { label: 'Anwesenheit', value: pct(data.attendance), icon: CalendarCheck },
    { label: 'Linientreue', value: data.loyalty === null ? '–' : pct(data.loyalty), icon: Heart },
    { label: 'Abweichungen', value: String(data.defections), icon: UserX },
    { label: 'Abstimmungen', value: String(data.votesAppeared), icon: Vote },
  ]
  return (
    <main className="mx-auto max-w-3xl p-l">
      <h1 className="text-xxl font-semibold">{data.name}</h1>
      <div className="mt-s mb-l flex items-center gap-m text-m">
        <PartyBadge party={data.party} />
        <span className="opacity-l">{data.state}</span>
      </div>
      <StatTiles tiles={tiles} />
      <MemberDetailTabs memberId={data.id} />
      {children}
    </main>
  )
}
