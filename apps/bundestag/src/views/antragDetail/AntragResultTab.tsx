import type { AntragLinkedVote } from '@/server/antraege'
import { AntragVoteResult } from './AntragVoteResult'

type Props = {
  votes: AntragLinkedVote[]
}

export function AntragResultTab({ votes }: Props) {
  return (
    <div className="flex flex-col gap-xl">
      {votes.map((vote) => <AntragVoteResult key={vote.id} vote={vote} />)}
    </div>
  )
}
