import type { MemberVoteRow } from '@/server/memberDetail'
import { MemberVoteCard } from './MemberVoteCard'

type Props = {
  history: MemberVoteRow[]
}

export function VotingRecordTab({ history }: Props) {
  return (
    <div className="flex flex-col">
      {history.map((vote, index) => (
        <div
          key={vote.voteId}
          className={`relative py-m ${index < history.length - 1 ? 'after:absolute after:inset-x-l after:bottom-0 after:h-px after:bg-elevated' : ''}`}
        >
          <MemberVoteCard vote={vote} />
        </div>
      ))}
    </div>
  )
}
