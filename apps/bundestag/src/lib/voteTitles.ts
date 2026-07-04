export type VoteTitleFields = {
  id: string
  title: string
  cleanTitle: string | null
}

export function requireVoteCleanTitle<T extends VoteTitleFields>(vote: T): T & { cleanTitle: string } {
  if (!vote.cleanTitle?.trim()) throw new Error(`Missing clean_title for vote ${vote.id}`)
  return { ...vote, cleanTitle: vote.cleanTitle }
}

export function requireVoteTitleText(voteId: string | null, cleanTitle: string | null | undefined): string | null {
  if (voteId && !cleanTitle?.trim()) throw new Error(`Missing clean_title for vote ${voteId}`)
  return voteId && cleanTitle ? cleanTitle : null
}
