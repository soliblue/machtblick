import { createServerFn } from '@tanstack/react-start'
import { db } from '@machtblick/db/client'
import { members, voteMembers, votePartySummaries, votes } from '@machtblick/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCurrentPartyMap, loadAffiliationsByMember, partyAt } from './memberParty'
import { loadDemographics } from './demographics'
import { majorityChoice } from './majorityChoice'
import { CURRENT_TERM } from './term'
import { hasPartyLine } from '../lib/parties'

export type MemberSex = 'm' | 'f' | 'd'
export type MandateType = 'direkt' | 'liste'

export type MemberListItem = {
  id: string
  name: string
  lastName: string
  party: string
  state: string
  votesAppeared: number
  attendance: number
  loyalty: number | null
  yearOfBirth: number | null
  sex: MemberSex | null
  mandateType: MandateType | null
  pictureUrl: string | null
}

export const listMembers = createServerFn({ method: 'GET' }).handler(async (): Promise<MemberListItem[]> => {
  const allMembers = db.select().from(members).all()
  const nonProceduralVotes = db.select({ id: votes.id, date: votes.date }).from(votes).where(and(eq(votes.termId, CURRENT_TERM), eq(votes.procedural, false))).all()
  const dateByVote = new Map(nonProceduralVotes.map((v) => [v.id, v.date]))
  const vmRows = db.select().from(voteMembers).all().filter((r) => dateByVote.has(r.voteId))
  const summaries = db.select().from(votePartySummaries).all().filter((s) => dateByVote.has(s.voteId))
  const majByVoteParty = new Map<string, string>()
  for (const s of summaries) majByVoteParty.set(`${s.voteId} ${s.party}`, majorityChoice(s))
  const affByMember = loadAffiliationsByMember()
  const currentPartyByMember = getCurrentPartyMap()
  const demographics = loadDemographics()
  const mandateByMember = new Map(allMembers.map((m) => [m.id, m.mandateType]))
  const pictureByMember = new Map(allMembers.map((m) => [m.id, m.pictureUrl]))
  const stats = new Map<string, { name: string; lastName: string; party: string; state: string; total: number; absent: number; loyalMatches: number; loyalEligible: number }>()
  for (const m of allMembers) stats.set(m.id, { name: m.name, lastName: m.lastName, party: currentPartyByMember.get(m.id) ?? '', state: '', total: 0, absent: 0, loyalMatches: 0, loyalEligible: 0 })
  for (const r of vmRows) {
    const s = stats.get(r.memberId)
    if (!s) continue
    s.state = r.state
    s.total++
    if (r.choice === 'nicht_abgegeben') s.absent++
    else {
      const partyAtVote = partyAt(affByMember.get(r.memberId), dateByVote.get(r.voteId)!)
      if (hasPartyLine(partyAtVote)) {
        s.loyalEligible++
        const maj = majByVoteParty.get(`${r.voteId} ${partyAtVote}`)
        if (maj && maj === r.choice) s.loyalMatches++
      }
    }
  }
  const out: MemberListItem[] = []
  for (const [id, s] of stats) {
    if (!s.total) continue
    const demo = demographics.get(id)
    out.push({
      id,
      name: s.name,
      lastName: s.lastName,
      party: s.party,
      state: s.state,
      votesAppeared: s.total,
      attendance: 1 - s.absent / s.total,
      loyalty: s.loyalEligible > 0 ? s.loyalMatches / s.loyalEligible : null,
      yearOfBirth: demo?.yearOfBirth ?? null,
      sex: demo?.sex ?? null,
      mandateType: mandateByMember.get(id) === 'direkt' || mandateByMember.get(id) === 'liste' ? (mandateByMember.get(id) as MandateType) : null,
      pictureUrl: pictureByMember.get(id) ?? null,
    })
  }
  out.sort((a, b) => a.lastName.localeCompare(b.lastName, 'de') || a.name.localeCompare(b.name, 'de'))
  return out
})
