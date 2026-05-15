import type { MemberVoteRow } from '@/server/members'
import type { VoteDetail as VoteDetailData } from '@/server/votes'
import { DebateList } from './DebateList'

type Props = { data: VoteDetailData }

export function SpeechesTab({ data }: Props) {
  const ballotByMember = new Map(
    data.memberBallots.map((b) => [b.memberId, { choice: b.choice as MemberVoteRow['choice'], pictureUrl: b.pictureUrl }]),
  )
  return data.debate.length > 0
    ? <DebateList speeches={data.debate} ballotByMember={ballotByMember} partySummaries={data.partySummaries} />
    : <p className="text-m opacity-l">Noch keine Reden verfügbar.</p>
}
