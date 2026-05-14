import type { PartyDetail as PartyDetailData } from '@/server/parties'
import { AlignmentList } from './AlignmentList'
import { DonationsBar } from './DonationsBar'
import { ProposalsBar } from './ProposalsBar'
import { StatPie } from './StatPie'

type Props = { data: PartyDetailData }

export function PartyProfilePanel({ data }: Props) {
  return (
    <div className="grid gap-x-xl gap-y-l md:grid-cols-2">
      <div className="flex justify-around gap-l">
        <StatPie
          label="Geschlossenheit"
          value={data.cohesion}
          info="Anteil der Fraktion, der bei einer Abstimmung dieselbe Position einnimmt. Berechnet über alle Abstimmungen (namentlich, Handzeichen, Hammelsprung), bei denen eine Fraktionsabstimmung erfasst ist."
        />
        <StatPie
          label="Anwesenheit"
          value={data.attendance}
          info="Anteil der Fraktionsmitglieder, die bei einer Abstimmung anwesend waren. Berechnet über alle Abstimmungen, bei denen eine Fraktionsabstimmung erfasst ist."
        />
      </div>
      {data.alignments.length > 0 ? (
        <div>
          <div className="mb-s text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>Übereinstimmung</div>
          <AlignmentList alignments={data.alignments} party={data.party} />
        </div>
      ) : <div />}
      {data.proposals.length > 0 ? <ProposalsBar proposals={data.proposals} /> : <div />}
      {data.donations.length > 0 ? <DonationsBar donations={data.donations} totalEur={data.donationsTotalEur} /> : <div />}
    </div>
  )
}
