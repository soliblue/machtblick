import { useState } from 'react'
import { CalendarCheck, Heart, Vote, UserX } from 'lucide-react'
import type { MemberDetail as MemberDetailData } from '@/server/members'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { pct } from '@/lib/format'
import { StatTiles } from './StatTiles'
import { VotingRecordTab } from './VotingRecordTab'
import { MemberSpeechesSection } from './MemberSpeechesSection'

type Props = { data: MemberDetailData }

export function MemberDetail({ data }: Props) {
  const [lineFilter, setLineFilter] = useState<string | null>(null)
  const [choiceFilter, setChoiceFilter] = useState<string | null>(null)
  return (
    <main className="mx-auto max-w-3xl p-l">
      <h1 className="text-xxl font-semibold">{data.name}</h1>
      <div className="mt-s mb-l flex items-center gap-m text-m">
        <PartyBadge party={data.party} />
        <span className="opacity-l">{data.state}</span>
      </div>
      <StatTiles
        tiles={[
          { label: 'Anwesenheit', value: pct(data.attendance), icon: CalendarCheck },
          { label: 'Linientreue', value: pct(data.loyalty), icon: Heart },
          { label: 'Abstimmungen', value: String(data.votesAppeared), icon: Vote },
          {
            label: 'Abweichungen',
            value: String(data.defections),
            icon: UserX,
            onClick: () => setLineFilter(lineFilter === 'abw' ? null : 'abw'),
            active: lineFilter === 'abw',
          },
        ]}
      />
      <div className="mt-l">
        <VotingRecordTab
          history={data.history}
          lineFilter={lineFilter}
          setLineFilter={setLineFilter}
          choiceFilter={choiceFilter}
          setChoiceFilter={setChoiceFilter}
        />
      </div>
      {data.speeches.length > 0 && (
        <div className="mt-xl">
          <MemberSpeechesSection speeches={data.speeches} />
        </div>
      )}
    </main>
  )
}
