import { createServerFn } from '@tanstack/react-start'
import { db } from '@machtblick/db/client'
import { votes, votePartySummaries, voteMembers, members, partyDonations, voteTranslations } from '@machtblick/db/schema'
import { desc, eq, and, inArray } from 'drizzle-orm'
import { SLUG_TO_PARTY, hasPartyLine } from '@/lib/parties'
import { getCurrentPartyMap } from './memberParty'
import { normalizeLocale, type Locale } from '@/lib/locale'

function cohesion(s: { yes: number; no: number; abstain: number; members: number; absent: number }) {
  const decided = s.yes + s.no + s.abstain
  if (!decided) return 0
  const top = Math.max(s.yes, s.no, s.abstain)
  return top / decided
}

function attendance(s: { members: number; absent: number }) {
  return s.members ? 1 - s.absent / s.members : 0
}

export type PartyListItem = {
  slug: string
  party: string
  seats: number
  cohesion: number
  attendance: number
}

export const listParties = createServerFn({ method: 'GET' }).handler(async (): Promise<PartyListItem[]> => {
  const namentlichVotes = db.select().from(votes).where(and(eq(votes.voteType, 'namentlich'), eq(votes.procedural, false))).orderBy(desc(votes.date), desc(votes.bundestagId)).all()
  const namentlichIds = new Set(namentlichVotes.map((v) => v.id))
  const summaries = db.select().from(votePartySummaries).all().filter((s) => namentlichIds.has(s.voteId)) as Array<{ party: string; members: number; yes: number; no: number; abstain: number; absent: number; voteId: string }>
  const byParty = new Map<string, typeof summaries>()
  for (const s of summaries) {
    const arr = byParty.get(s.party) ?? []
    arr.push(s)
    byParty.set(s.party, arr)
  }
  const latestVote = namentlichVotes[0]
  const seatsByParty = new Map<string, number>()
  if (latestVote) {
    for (const s of summaries) if (s.voteId === latestVote.id) seatsByParty.set(s.party, s.members)
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

export type PartyVote = 'yes' | 'no' | 'abstain' | 'split'

export type PartyVoteRow = {
  voteId: string
  date: string
  title: string
  cleanTitle: string | null
  result: 'angenommen' | 'abgelehnt'
  partyVote: PartyVote
  cohesion: number
  yes: number
  no: number
  abstain: number
  absent: number
  members: number
}

export type PartyMemberRow = {
  id: string
  name: string
  state: string
}

export type PartyAlignment = {
  party: string
  agreement: number
  sharedVotes: number
}

export type PartyProposal = {
  voteId: string
  date: string
  title: string
  cleanTitle: string | null
  result: 'angenommen' | 'abgelehnt'
}

export type PartyDonation = {
  id: string
  donor: string
  amountEur: number
  dateReceived: string
}

const DONATION_PARTY_NAMES: Record<string, string[]> = {
  'CDU/CSU': ['CDU', 'CSU'],
  SPD: ['SPD'],
  AfD: ['AfD'],
  'B90/Grüne': ['B90/Grüne'],
  'Die Linke': ['Die Linke'],
}

export type PartyDetail = {
  slug: string
  party: string
  seats: number
  cohesion: number
  attendance: number
  successRate: number
  proposalsTotal: number
  proposalsAccepted: number
  proposals: PartyProposal[]
  donations: PartyDonation[]
  donationsTotalEur: number
  donationsCount: number
  votes: PartyVoteRow[]
  members: PartyMemberRow[]
  alignments: PartyAlignment[]
}

function translationMap(ids: string[], locale: Locale) {
  return new Map(
    locale === 'en' && ids.length
      ? db.select().from(voteTranslations).where(and(eq(voteTranslations.locale, 'en'), inArray(voteTranslations.voteId, ids))).all().map((t) => [t.voteId, t])
      : [],
  )
}

function majorityPosition(s: { yes: number; no: number; abstain: number }): 'yes' | 'no' | null {
  if (s.yes > s.no && s.yes > s.abstain) return 'yes'
  if (s.no > s.yes && s.no > s.abstain) return 'no'
  return null
}

export const getParty = createServerFn({ method: 'GET' })
  .inputValidator((input: string | { slug: string; locale?: Locale }) => typeof input === 'string' ? { slug: input, locale: 'de' as Locale } : { slug: input.slug, locale: normalizeLocale(input.locale) })
  .handler(async ({ data }): Promise<PartyDetail> => {
    const { slug, locale } = data
    const party = SLUG_TO_PARTY[slug]
    if (!party) throw new Error(`party not found: ${slug}`)
    const summaries = db
      .select({
        voteId: votePartySummaries.voteId,
        members: votePartySummaries.members,
        yes: votePartySummaries.yes,
        no: votePartySummaries.no,
        abstain: votePartySummaries.abstain,
        absent: votePartySummaries.absent,
        date: votes.date,
        title: votes.title,
        cleanTitle: votes.cleanTitle,
        result: votes.result,
        document: votes.document,
        voteType: votes.voteType,
      })
      .from(votePartySummaries)
      .innerJoin(votes, eq(votes.id, votePartySummaries.voteId))
      .where(and(eq(votePartySummaries.party, party), eq(votes.procedural, false)))
      .orderBy(desc(votes.date))
      .all()
      .filter((s) => s.yes != null) as Array<{ voteId: string; members: number; yes: number; no: number; abstain: number; absent: number; date: string; title: string; cleanTitle: string | null; result: 'angenommen' | 'abgelehnt'; document: string | null; voteType: string }>
    const summaryTranslations = translationMap(summaries.map((s) => s.voteId), locale)
    const voteRows: PartyVoteRow[] = summaries.filter((s) => s.voteType === 'namentlich').map((s) => {
      const t = summaryTranslations.get(s.voteId)
      const top = Math.max(s.yes, s.no, s.abstain)
      const partyVote: PartyVote =
        s.yes === top && s.yes > s.no && s.yes > s.abstain ? 'yes'
        : s.no === top && s.no > s.yes && s.no > s.abstain ? 'no'
        : s.abstain === top && s.abstain > s.yes && s.abstain > s.no ? 'abstain'
        : 'split'
      return {
        voteId: s.voteId,
        date: s.date,
        title: t?.title ?? s.title,
        cleanTitle: t?.cleanTitle ?? s.cleanTitle,
        result: s.result,
        partyVote,
        cohesion: hasPartyLine(party) ? cohesion(s) : null,
        yes: s.yes,
        no: s.no,
        abstain: s.abstain,
        absent: s.absent,
        members: s.members,
      }
    })
    const currentPartyByMember = getCurrentPartyMap()
    const stateByMember = new Map<string, string>()
    const stateRows = db.select({ memberId: voteMembers.memberId, state: voteMembers.state }).from(voteMembers).all()
    for (const r of stateRows) if (!stateByMember.has(r.memberId)) stateByMember.set(r.memberId, r.state)
    const memberRows: PartyMemberRow[] = db
      .select({ id: members.id, name: members.name })
      .from(members)
      .all()
      .filter((m) => currentPartyByMember.get(m.id) === party)
      .map((m) => ({ id: m.id, name: m.name, state: stateByMember.get(m.id) ?? '' }))
    memberRows.sort((a, b) => a.name.localeCompare(b.name, 'de'))
    const allSummaries = db
      .select({
        voteId: votePartySummaries.voteId,
        party: votePartySummaries.party,
        yes: votePartySummaries.yes,
        no: votePartySummaries.no,
        abstain: votePartySummaries.abstain,
      })
      .from(votePartySummaries)
      .innerJoin(votes, eq(votes.id, votePartySummaries.voteId))
      .where(and(eq(votes.voteType, 'namentlich'), eq(votes.procedural, false)))
      .all() as Array<{ voteId: string; party: string; yes: number; no: number; abstain: number }>
    const byVote = new Map<string, Map<string, 'yes' | 'no' | null>>()
    for (const s of allSummaries) {
      const pos = majorityPosition(s)
      if (!byVote.has(s.voteId)) byVote.set(s.voteId, new Map())
      byVote.get(s.voteId)!.set(s.party, pos)
    }
    const pairCounts = new Map<string, { matched: number; shared: number }>()
    for (const positions of byVote.values()) {
      const selfPos = positions.get(party)
      if (!selfPos) continue
      for (const [other, otherPos] of positions) {
        if (other === party || other === 'fraktionslos' || !otherPos) continue
        const c = pairCounts.get(other) ?? { matched: 0, shared: 0 }
        c.shared += 1
        if (otherPos === selfPos) c.matched += 1
        pairCounts.set(other, c)
      }
    }
    const alignments: PartyAlignment[] = Array.from(pairCounts.entries())
      .filter(([, c]) => c.shared > 0)
      .map(([p, c]) => ({ party: p, agreement: c.matched / c.shared, sharedVotes: c.shared }))
      .sort((a, b) => b.agreement - a.agreement)
    let successDecided = 0
    let successMatched = 0
    for (const r of voteRows) {
      if (r.partyVote === 'yes' || r.partyVote === 'no') {
        successDecided += 1
        const wanted = r.partyVote === 'yes' ? 'angenommen' : 'abgelehnt'
        if (r.result === wanted) successMatched += 1
      }
    }
    const successRate = successDecided ? successMatched / successDecided : 0
    let proposalsTotal = 0
    let proposalsAccepted = 0
    const proposals: PartyProposal[] = []
    const allVotes = db
      .select({ id: votes.id, initiator: votes.initiator, result: votes.result, date: votes.date, title: votes.title, cleanTitle: votes.cleanTitle })
      .from(votes)
      .where(eq(votes.procedural, false))
      .all() as Array<{ id: string; initiator: string | null; result: 'angenommen' | 'abgelehnt'; date: string; title: string; cleanTitle: string | null }>
    const proposalTranslations = translationMap(allVotes.map((v) => v.id), locale)
    for (const v of allVotes) {
      if (v.initiator !== party) continue
      const t = proposalTranslations.get(v.id)
      proposalsTotal += 1
      if (v.result === 'angenommen') proposalsAccepted += 1
      proposals.push({ voteId: v.id, date: v.date, title: t?.title ?? v.title, cleanTitle: t?.cleanTitle ?? v.cleanTitle, result: v.result })
    }
    proposals.sort((a, b) => b.date.localeCompare(a.date))
    const donationNames = DONATION_PARTY_NAMES[party] ?? [party]
    const donationRows = db
      .select({ id: partyDonations.id, donor: partyDonations.donor, amountEur: partyDonations.amountEur, dateReceived: partyDonations.dateReceived })
      .from(partyDonations)
      .where(inArray(partyDonations.party, donationNames))
      .orderBy(desc(partyDonations.amountEur))
      .all() as PartyDonation[]
    const donationsTotalEur = donationRows.reduce((a, d) => a + d.amountEur, 0)
    const seats = voteRows[0]?.members ?? 0
    const avgCoh = summaries.reduce((a, s) => a + cohesion(s), 0) / Math.max(summaries.length, 1)
    const avgAtt = summaries.reduce((a, s) => a + attendance(s), 0) / Math.max(summaries.length, 1)
    return {
      slug,
      party,
      seats,
      cohesion: avgCoh,
      attendance: avgAtt,
      successRate,
      proposalsTotal,
      proposalsAccepted,
      proposals,
      donations: donationRows,
      donationsTotalEur,
      donationsCount: donationRows.length,
      votes: voteRows,
      members: memberRows,
      alignments,
    }
  })
