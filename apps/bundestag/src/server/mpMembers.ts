import { createServerFn } from '@tanstack/react-start'
import { db } from '@machtblick/db/client'
import { mpMembers, mpMemberVotes, mpVotePartySummaries } from '@machtblick/db/schema'
import { eq } from 'drizzle-orm'
import type { ParliamentDbKey } from '../lib/parliaments'
import { loadMpParties } from './mpPartyMap'

export type MpMemberListItem = {
  id: string
  name: string
  lastName: string
  party: string
  label: string
  nationalParty: string | null
  country: string | null
  state: string | null
  pictureUrl: string | null
  votesAppeared: number
  attendance: number
  loyalty: number | null
}

const asParliament = (input: unknown): ParliamentDbKey => (input === 'be' || input === 'by' ? input : 'eu')

const majorityOf = (s: { yes: number | null; no: number | null; abstain: number | null }) => {
  const choices = [
    ['ja', s.yes ?? 0],
    ['nein', s.no ?? 0],
    ['enthalten', s.abstain ?? 0],
  ] as const
  const top = choices.reduce((a, b) => (b[1] > a[1] ? b : a))
  return top[1] > 0 ? top[0] : null
}

export const mpMembersList = createServerFn({ method: 'GET' })
  .inputValidator(asParliament)
  .handler(async ({ data: parliament }): Promise<MpMemberListItem[]> => {
    const parties = loadMpParties(parliament)
    const members = db.select().from(mpMembers).where(eq(mpMembers.parliament, parliament)).all()
    const summaries = db.select().from(mpVotePartySummaries).where(eq(mpVotePartySummaries.parliament, parliament)).all()
    const majByVoteParty = new Map<string, string | null>()
    for (const s of summaries) majByVoteParty.set(`${s.voteId} ${s.party}`, majorityOf(s))
    const partyByMember = new Map(members.map((m) => [m.id, m.party]))
    const stats = new Map(members.map((m) => [m.id, { total: 0, absent: 0, loyalEligible: 0, loyalMatches: 0 }]))
    const ballots = db.select().from(mpMemberVotes).where(eq(mpMemberVotes.parliament, parliament)).all()
    for (const b of ballots) {
      const s = stats.get(b.memberId)
      if (!s) continue
      s.total++
      if (b.choice === 'nicht_abgegeben') {
        s.absent++
        continue
      }
      const party = partyByMember.get(b.memberId)
      const maj = party ? majByVoteParty.get(`${b.voteId} ${party}`) : null
      if (maj) {
        s.loyalEligible++
        if (maj === b.choice) s.loyalMatches++
      }
    }
    const out = members
      .map((m) => {
        const s = stats.get(m.id)!
        return {
          id: m.id,
          name: m.name,
          lastName: m.lastName ?? m.name,
          party: m.party ?? '',
          label: m.party ? parties.get(m.party)?.label ?? m.party : '',
          nationalParty: m.nationalParty,
          country: m.country,
          state: m.state,
          pictureUrl: m.pictureUrl,
          votesAppeared: s.total,
          attendance: s.total ? 1 - s.absent / s.total : 0,
          loyalty: s.loyalEligible > 0 ? s.loyalMatches / s.loyalEligible : null,
        }
      })
      .filter((m) => m.votesAppeared > 0)
    out.sort((a, b) => a.lastName.localeCompare(b.lastName, 'de') || a.name.localeCompare(b.name, 'de'))
    return out
  })
