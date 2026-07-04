import type { MemberVoteRow } from '@/server/memberDetail'
import type { VoteDetail as VoteDetailData } from '@/server/voteDetail'
import { DebateList } from './DebateList'
import { useCopy } from '@/lib/i18n'

type Props = { data: VoteDetailData }

export function SpeechesTab({ data }: Props) {
  const t = useCopy()
  const ballotByMember = new Map(
    data.memberBallots.map((b) => [b.memberId, { choice: b.choice as MemberVoteRow['choice'], pictureUrl: b.pictureUrl }]),
  )
  return data.debate.length > 0
    ? <DebateList speeches={data.debate} source={data.debateSource} ballotByMember={ballotByMember} partySummaries={data.partySummaries} />
    : <p className="text-m opacity-l">{t.noSpeechesAvailable}</p>
}
