import type { AntragDetail } from '@/server/antraege'
import type { MemberVoteRow } from '@/server/memberDetail'
import { DebateList } from '@/views/voteDetail/DebateList'

type Props = {
  data: AntragDetail
}

export function AntragSpeechesTab({ data }: Props) {
  const ballotByMember = new Map<string, { choice: MemberVoteRow['choice']; pictureUrl: string | null }>()
  for (const vote of data.linkedVotes) {
    for (const ballot of vote.memberBallots) {
      if (!ballotByMember.has(ballot.memberId)) {
        ballotByMember.set(ballot.memberId, {
          choice: ballot.choice as MemberVoteRow['choice'],
          pictureUrl: ballot.pictureUrl,
        })
      }
    }
  }
  return (
    <DebateList
      speeches={data.debate}
      source={data.debateSource}
      ballotByMember={ballotByMember}
      partySummaries={data.linkedVotes.find((vote) => vote.partySummaries.length > 0)?.partySummaries ?? []}
    />
  )
}
