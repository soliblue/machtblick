import { createServerFn } from '@tanstack/react-start'
import { db } from '@machtblick/db/client'
import { votes, votePartySummaries } from '@machtblick/db/schema'
import { desc, eq, and } from 'drizzle-orm'
import { SLUG_TO_PARTY } from '@/lib/parties'
import { attendance, cohesion } from './partyStats'
import { CURRENT_TERM } from './term'

export type PartyListItem = {
  slug: string
  party: string
  seats: number
  cohesion: number
  attendance: number
}

export const listParties = createServerFn({ method: 'GET' }).handler(async (): Promise<PartyListItem[]> => {
  const namentlichVotes = db.select().from(votes).where(and(eq(votes.termId, CURRENT_TERM), eq(votes.voteType, 'namentlich'), eq(votes.procedural, false))).orderBy(desc(votes.date), desc(votes.bundestagId)).all()
  const namentlichIds = new Set(namentlichVotes.map((v) => v.id))
  const summaries = db.select().from(votePartySummaries).all().filter((s) => namentlichIds.has(s.voteId))
  const byParty = new Map<string, typeof summaries>()
  for (const s of summaries) {
    const arr = byParty.get(s.party) ?? []
    arr.push(s)
    byParty.set(s.party, arr)
  }
  const latestVote = namentlichVotes[0]
  const seatsByParty = new Map<string, number>()
  if (latestVote) {
    for (const s of summaries) if (s.voteId === latestVote.id) seatsByParty.set(s.party, s.members ?? 0)
  }
  const out: PartyListItem[] = []
  for (const [party, list] of byParty) {
    if (list.length === 0) continue
    const avgCoh = list.reduce((a, s) => a + cohesion(s), 0) / list.length
    const avgAtt = list.reduce((a, s) => a + attendance(s), 0) / list.length
    out.push({
      slug: Object.entries(SLUG_TO_PARTY).find(([, p]) => p === party)?.[0] ?? party.toLowerCase(),
      party,
      seats: seatsByParty.get(party) ?? 0,
      cohesion: avgCoh,
      attendance: avgAtt,
    })
  }
  out.sort((a, b) => b.seats - a.seats)
  return out
})
