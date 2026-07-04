import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { db } from '@machtblick/db/client'
import { votes, votePartySummaries, voteMembers, members, partyDonations } from '@machtblick/db/schema'
import { desc, eq, and, inArray } from 'drizzle-orm'
import { SLUG_TO_PARTY, hasPartyLine } from '@/lib/parties'
import { getCurrentPartyMap } from './memberParty'
import { attendance, cohesion } from './partyStats'
import { CURRENT_TERM } from './term'
import { voteTranslationMap } from './translations'
import { normalizeLocale, type Locale } from '@/lib/locale'
import { requireVoteCleanTitle } from '@/lib/voteTitles'

export type PartyVote = 'yes' | 'no' | 'abstain' | 'split'

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

export type PartyAlignment = {
  party: string
  agreement: number
  sharedVotes: number
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

function majorityPosition(s: { yes: number | null; no: number | null; abstain: number | null }): 'yes' | 'no' | null {
  const yes = s.yes ?? 0
  const no = s.no ?? 0
  const abstain = s.abstain ?? 0
  if (yes > no && yes > abstain) return 'yes'
  if (no > yes && no > abstain) return 'no'
  return null
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
        voteType: votes.voteType,
      })
      .from(votePartySummaries)
      .innerJoin(votes, eq(votes.id, votePartySummaries.voteId))
      .where(and(eq(votePartySummaries.party, party), eq(votes.termId, CURRENT_TERM), eq(votes.procedural, false)))
      .orderBy(desc(votes.date))
      .all()
      .filter((s) => s.yes != null)
    const summaryTranslations = voteTranslationMap(summaries.map((s) => s.voteId), locale)
    const voteRows: PartyVoteRow[] = summaries.filter((s) => s.voteType === 'namentlich').map((s) => {
      const t = summaryTranslations.get(s.voteId)
      const titled = requireVoteCleanTitle({ id: s.voteId, title: s.title, cleanTitle: t?.cleanTitle ?? s.cleanTitle })
      const yes = s.yes ?? 0
      const no = s.no ?? 0
      const abstain = s.abstain ?? 0
      const top = Math.max(yes, no, abstain)
      const partyVote: PartyVote =
        yes === top && yes > no && yes > abstain ? 'yes'
        : no === top && no > yes && no > abstain ? 'no'
        : abstain === top && abstain > yes && abstain > no ? 'abstain'
        : 'split'
      return {
        voteId: s.voteId,
        date: s.date,
        title: titled.title,
        cleanTitle: titled.cleanTitle,
        result: s.result,
        partyVote,
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
      .where(and(eq(votes.termId, CURRENT_TERM), eq(votes.voteType, 'namentlich'), eq(votes.procedural, false)))
      .all()
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
