import type { MpVoteListItem } from '@/server/mpVotes'

export function mpDek(vote: Pick<MpVoteListItem, 'result' | 'yes' | 'no' | 'abstain'>) {
  const verb = vote.result === 'angenommen' ? 'Angenommen' : 'Abgelehnt'
  const tail = vote.abstain > 0 ? ` bei ${vote.abstain} Enthaltungen` : ''
  return `${verb} mit ${vote.yes} zu ${vote.no} Stimmen${tail}.`
}
