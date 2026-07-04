import type { PartyDetail as PartyDetailData } from '@/server/partyDetail'
import { AlignmentList } from './AlignmentList'
import { DonationsBar } from './DonationsBar'
import { PartyDemographics } from './PartyDemographics'
import { ProposalsBar } from './ProposalsBar'
import { SuccessRateBar } from './SuccessRateBar'
import { useCopy } from '@/lib/i18n'

type Props = { data: PartyDetailData }

export function PartyProfilePanel({ data }: Props) {
  const t = useCopy()
  return (
    <div className="grid gap-x-xl gap-y-xl desk:grid-cols-2">
      <div className="flex flex-col gap-xl">
        <SuccessRateBar rate={data.successRate} matched={data.successMatched} decided={data.successDecided} />
        {data.alignments.length > 0 && (
          <div>
            <div className="mb-s text-s caption opacity-l">{t.agreement}</div>
            <AlignmentList alignments={data.alignments} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-xl">
        {data.proposals.length > 0 && <ProposalsBar proposals={data.proposals} />}
        {data.donations.length > 0 && <DonationsBar donations={data.donations} totalEur={data.donationsTotalEur} />}
      </div>
      <PartyDemographics
        demographics={data.demographics}
        party={data.party}
        membersCount={data.members.length}
        className="desk:col-span-2"
      />
    </div>
  )
}
