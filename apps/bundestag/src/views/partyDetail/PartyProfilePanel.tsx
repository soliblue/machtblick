import type { PartyDetail as PartyDetailData } from '@/server/parties'
import { AlignmentList } from './AlignmentList'
import { DonationsBar } from './DonationsBar'
import { ProposalsBar } from './ProposalsBar'
import { StatPie } from './StatPie'
import { useCopy } from '@/lib/i18n'

type Props = { data: PartyDetailData }

export function PartyProfilePanel({ data }: Props) {
  const t = useCopy()
  return (
    <div className="grid gap-x-xl gap-y-l md:grid-cols-2">
      <div className="flex justify-around gap-l">
        <StatPie
          label={t.cohesion}
          value={data.cohesion}
          info={t.cohesionInfo}
        />
        <StatPie
          label={t.attendance}
          value={data.attendance}
          info={t.attendanceInfo}
        />
      </div>
      {data.alignments.length > 0 ? (
        <div>
          <div className="mb-s text-s caption opacity-l">{t.agreement}</div>
          <AlignmentList alignments={data.alignments} party={data.party} />
        </div>
      ) : <div />}
      {data.proposals.length > 0 ? <ProposalsBar proposals={data.proposals} /> : <div />}
      {data.donations.length > 0 ? <DonationsBar donations={data.donations} totalEur={data.donationsTotalEur} /> : <div />}
    </div>
  )
}
