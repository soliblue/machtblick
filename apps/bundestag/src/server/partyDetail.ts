import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { db } from '@machtblick/db/client'
import { votes, votePartySummaries, voteMembers, members, partyDonations } from '@machtblick/db/schema'
import { desc, eq, and, inArray } from 'drizzle-orm'
import { DONATION_PARTY_NAMES, SLUG_TO_PARTY, hasPartyLine } from '@/lib/parties'
import { AGE_BUCKETS, ageBucketFor, type AgeBucket, type MemberSex } from '@/lib/memberFacets'
import { getCurrentPartyMap } from './memberParty'
import { loadDemographics } from './demographics'
import { attendance, cohesion, majorityPosition, partyAlignments, partyVote, successCounts, type PartyAlignment, type PartyVote } from './partyStats'
import { getChamberSize } from './seats'
import { CURRENT_TERM } from './term'
import { voteTranslationMap } from './translations'
import { normalizeLocale, type Locale } from '@/lib/locale'
import { requireVoteCleanTitle } from '@/lib/voteTitles'

export type PartyVoteRow = {
  voteId: string
  date: string
  title: string
  cleanTitle: string
  result: 'angenommen' | 'abgelehnt'
  partyVote: PartyVote
  cohesion: number | null
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

export type PartyProposal = {
  voteId: string
  date: string
  title: string
  cleanTitle: string
  result: 'angenommen' | 'abgelehnt'
}

export type PartyDonation = {
  id: string
  donor: string
  amountEur: number
  dateReceived: string
}

export type PartyDemographics = {
  sex: Record<MemberSex | 'unbekannt', number>
  age: Record<AgeBucket, number>
}

export type PartyDetail = {
  slug: string
  party: string
  seats: number
  chamberSeats: number
  cohesion: number
  attendance: number
  successRate: number
  successMatched: number
  successDecided: number
  demographics: PartyDemographics
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

export const getParty = createServerFn({ method: 'GET' })
  .inputValidator((input: string | { slug: string; locale?: Locale }) => typeof input === 'string' ? { slug: input, locale: 'de' as Locale } : { slug: input.slug, locale: normalizeLocale(input.locale) })
  .handler(async ({ data }): Promise<PartyDetail> => {
    const { slug, locale } = data
    const party = SLUG_TO_PARTY[slug]
    if (!party) throw notFound()
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
      })
      .from(votePartySummaries)
      .innerJoin(votes, eq(votes.id, votePartySummaries.voteId))
      .where(and(eq(votePartySummaries.party, party), eq(votes.termId, CURRENT_TERM), eq(votes.procedural, false), eq(votes.voteType, 'namentlich')))
      .orderBy(desc(votes.date))
      .all()
      .filter((s) => s.yes != null)
    const summaryTranslations = voteTranslationMap(summaries.map((s) => s.voteId), locale)
    const voteRows: PartyVoteRow[] = summaries.map((s) => {
      const t = summaryTranslations.get(s.voteId)
      const titled = requireVoteCleanTitle({ id: s.voteId, title: s.title, cleanTitle: t?.cleanTitle ?? s.cleanTitle })
      const yes = s.yes ?? 0
      const no = s.no ?? 0
      const abstain = s.abstain ?? 0
      return {
        voteId: s.voteId,
        date: s.date,
        title: titled.title,
        cleanTitle: titled.cleanTitle,
        result: s.result,
        partyVote: partyVote({ yes, no, abstain }),
        cohesion: hasPartyLine(party) ? cohesion(s) : null,
        yes,
        no,
        abstain,
        absent: s.absent ?? 0,
        members: s.members ?? 0,
      }
    })
    const currentPartyByMember = getCurrentPartyMap()
    const stateByMember = new Map<string, string>()
    const stateRows = db
      .select({ memberId: voteMembers.memberId, state: voteMembers.state })
      .from(voteMembers)
      .innerJoin(votes, eq(votes.id, voteMembers.voteId))
      .where(eq(votes.termId, CURRENT_TERM))
      .all()
    for (const r of stateRows) if (!stateByMember.has(r.memberId)) stateByMember.set(r.memberId, r.state)
    const memberRows: PartyMemberRow[] = db
      .select({ id: members.id, name: members.name })
      .from(members)
      .all()
      .filter((m) => currentPartyByMember.get(m.id) === party && stateByMember.has(m.id))
      .map((m) => ({ id: m.id, name: m.name, state: stateByMember.get(m.id) ?? '' }))
    memberRows.sort((a, b) => a.name.localeCompare(b.name, 'de'))
    const demoByMember = loadDemographics()
    const sexCounts: PartyDemographics['sex'] = { m: 0, f: 0, d: 0, unbekannt: 0 }
    const ageCounts = Object.fromEntries(AGE_BUCKETS.map((b) => [b, 0])) as PartyDemographics['age']
    for (const m of memberRows) {
      const demo = demoByMember.get(m.id)
      sexCounts[demo?.sex ?? 'unbekannt'] += 1
      const bucket = ageBucketFor(demo?.yearOfBirth ?? null)
      if (bucket) ageCounts[bucket] += 1
    }
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
      .where(and(eq(votes.termId, CURRENT_TERM), eq(votes.voteType, 'namentlich'), eq(votes.procedural, false)))
      .all()
    const byVote = new Map<string, Map<string, 'yes' | 'no' | null>>()
    for (const s of allSummaries) {
      const pos = majorityPosition(s)
      if (!byVote.has(s.voteId)) byVote.set(s.voteId, new Map())
      byVote.get(s.voteId)!.set(s.party, pos)
    }
    const alignments = partyAlignments(byVote, party)
    const success = successCounts(voteRows)
    let proposalsTotal = 0
    let proposalsAccepted = 0
    const proposals: PartyProposal[] = []
    const allVotes = db
      .select({ id: votes.id, initiator: votes.initiator, result: votes.result, date: votes.date, title: votes.title, cleanTitle: votes.cleanTitle })
      .from(votes)
      .where(and(eq(votes.termId, CURRENT_TERM), eq(votes.procedural, false)))
      .all()
    const proposalTranslations = voteTranslationMap(allVotes.map((v) => v.id), locale)
    for (const v of allVotes) {
      if (v.initiator !== party) continue
      const t = proposalTranslations.get(v.id)
      const titled = requireVoteCleanTitle({ id: v.id, title: v.title, cleanTitle: t?.cleanTitle ?? v.cleanTitle })
      proposalsTotal += 1
      if (v.result === 'angenommen') proposalsAccepted += 1
      proposals.push({ voteId: v.id, date: v.date, title: titled.title, cleanTitle: titled.cleanTitle, result: v.result })
    }
    proposals.sort((a, b) => b.date.localeCompare(a.date))
    const donationNames = DONATION_PARTY_NAMES[party] ?? [party]
    const donationRows = db
      .select({ id: partyDonations.id, donor: partyDonations.donor, amountEur: partyDonations.amountEur, dateReceived: partyDonations.dateReceived })
      .from(partyDonations)
      .where(inArray(partyDonations.party, donationNames))
      .orderBy(desc(partyDonations.amountEur))
      .all()
    return {
      slug,
      party,
      seats: voteRows[0]?.members ?? 0,
      chamberSeats: getChamberSize(),
      cohesion: summaries.reduce((a, s) => a + cohesion(s), 0) / Math.max(summaries.length, 1),
      attendance: summaries.reduce((a, s) => a + attendance(s), 0) / Math.max(summaries.length, 1),
      successRate: success.decided ? success.matched / success.decided : 0,
      successMatched: success.matched,
      successDecided: success.decided,
      demographics: { sex: sexCounts, age: ageCounts },
      proposalsTotal,
      proposalsAccepted,
      proposals,
      donations: donationRows,
      donationsTotalEur: donationRows.reduce((a, d) => a + d.amountEur, 0),
      donationsCount: donationRows.length,
      votes: voteRows,
      members: memberRows,
      alignments,
    }
  })
