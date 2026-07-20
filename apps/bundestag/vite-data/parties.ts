import type Database from 'better-sqlite3'
import { DONATION_PARTY_NAMES, PARTY_SLUG, SLUG_TO_PARTY, hasPartyLine } from '../src/lib/parties'
import type { Locale } from '../src/lib/locale'
import { requireVoteCleanTitle } from '../src/lib/voteTitles'
import type { PartyListItem } from '../src/server/parties'
import { attendance, cohesion, majorityPosition, partyAlignments, partyVote, successCounts } from '../src/server/partyStats'
import { CURRENT_TERM } from '../src/server/term'
import { partyHistory } from './partyHistory'
import { voteTranslation, type StaticTranslations } from './translations'

type SummaryRow = {
  vote_id: string
  party: string
  members: number
  yes: number
  no: number
  abstain: number
  absent: number
}

type DonationRow = {
  id: string
  donor: string
  amount_eur: number
  date_received: string
}

export function leanParties(db: Database.Database) {
  const namentlichVotes = db.prepare(`
    SELECT id FROM votes WHERE term_id = ${CURRENT_TERM} AND vote_type = 'namentlich' AND procedural = 0 ORDER BY date DESC, bundestag_id DESC
  `).all() as Array<{ id: string }>
  const namentlichIds = new Set(namentlichVotes.map((v) => v.id))
  const summaries = (db.prepare('SELECT vote_id, party, members, yes, no, abstain, absent FROM vote_party_summaries').all() as SummaryRow[])
    .filter((s) => namentlichIds.has(s.vote_id))
  const byParty = new Map<string, SummaryRow[]>()
  for (const s of summaries) {
    const arr = byParty.get(s.party) ?? []
    arr.push(s)
    byParty.set(s.party, arr)
  }
  const latestId = namentlichVotes[0]?.id
  const seatsByParty = new Map<string, number>()
  if (latestId) {
    for (const s of summaries) if (s.vote_id === latestId) seatsByParty.set(s.party, s.members)
  }
  const out: PartyListItem[] = []
  for (const [party, list] of byParty) {
    out.push({
      slug: PARTY_SLUG[party] ?? party.toLowerCase(),
      party,
      seats: seatsByParty.get(party) ?? 0,
      cohesion: list.reduce((a, s) => a + cohesion(s), 0) / list.length,
      attendance: list.reduce((a, s) => a + attendance(s), 0) / list.length,
    })
  }
  out.sort((a, b) => b.seats - a.seats)
  return out
}

export function fullParty(db: Database.Database, slug: string, locale: Locale, translations: StaticTranslations) {
  const party = SLUG_TO_PARTY[slug]
  const summaries = db.prepare(`
    SELECT vps.vote_id, vps.members, vps.yes, vps.no, vps.abstain, vps.absent,
           v.date, v.title, v.clean_title, v.result
    FROM vote_party_summaries vps
    INNER JOIN votes v ON v.id = vps.vote_id
    WHERE vps.party = ? AND v.term_id = ${CURRENT_TERM} AND v.procedural = 0 AND v.vote_type = 'namentlich'
    ORDER BY v.date DESC
  `).all(party) as Array<SummaryRow & { date: string; title: string; clean_title: string | null; result: 'angenommen' | 'abgelehnt' }>
  const namentlich = summaries.filter((s) => s.yes != null)
  const voteRows = namentlich.map((s) => {
    const titled = requireVoteCleanTitle({
      id: s.vote_id,
      title: s.title,
      cleanTitle: voteTranslation(translations, locale, s.vote_id)?.clean_title ?? s.clean_title,
    })
    return {
      voteId: s.vote_id,
      date: s.date,
      title: titled.title,
      cleanTitle: titled.cleanTitle,
      result: s.result,
      partyVote: partyVote(s),
      cohesion: hasPartyLine(party) ? cohesion(s) : null,
      yes: s.yes,
      no: s.no,
      abstain: s.abstain,
      absent: s.absent,
      members: s.members,
    }
  })
  const currentPartyMembers = db.prepare(`
    SELECT ma.member_id FROM member_affiliations ma WHERE ma.term_id = ${CURRENT_TERM} AND ma.party = ? AND ma.valid_to IS NULL
  `).all(party) as Array<{ member_id: string }>
  const memberIds = new Set(currentPartyMembers.map((r) => r.member_id))
  const allMemberRows = db.prepare('SELECT id, name FROM members').all() as Array<{ id: string; name: string }>
  const stateRows = db.prepare(`
    SELECT vm.member_id, vm.state
    FROM vote_members vm
    INNER JOIN votes v ON v.id = vm.vote_id
    WHERE v.term_id = ${CURRENT_TERM}
  `).all() as Array<{ member_id: string; state: string }>
  const stateByMember = new Map<string, string>()
  for (const r of stateRows) if (!stateByMember.has(r.member_id)) stateByMember.set(r.member_id, r.state)
  const memberRows = allMemberRows
    .filter((m) => memberIds.has(m.id) && stateByMember.has(m.id))
    .map((m) => ({ id: m.id, name: m.name, state: stateByMember.get(m.id) ?? '' }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
  const allSummaries = db.prepare(`
    SELECT vps.vote_id, vps.party, vps.yes, vps.no, vps.abstain
    FROM vote_party_summaries vps
    INNER JOIN votes v ON v.id = vps.vote_id
    WHERE v.term_id = ${CURRENT_TERM} AND v.vote_type = 'namentlich' AND v.procedural = 0
  `).all() as Array<{ vote_id: string; party: string; yes: number; no: number; abstain: number }>
  const byVote = new Map<string, Map<string, 'yes' | 'no' | null>>()
  for (const s of allSummaries) {
    if (!byVote.has(s.vote_id)) byVote.set(s.vote_id, new Map())
    byVote.get(s.vote_id)!.set(s.party, majorityPosition(s))
  }
  const alignments = partyAlignments(byVote, party)
  const success = successCounts(voteRows)
  const allVotes = db.prepare(`
    SELECT id, initiator, result, date, title, clean_title FROM votes WHERE term_id = ${CURRENT_TERM} AND procedural = 0
  `).all() as Array<{ id: string; initiator: string | null; result: 'angenommen' | 'abgelehnt'; date: string; title: string; clean_title: string | null }>
  let proposalsTotal = 0
  let proposalsAccepted = 0
  const proposals: Array<{ voteId: string; date: string; title: string; cleanTitle: string | null; result: 'angenommen' | 'abgelehnt' }> = []
  for (const v of allVotes) {
    if (v.initiator !== party) continue
    const translatedVote = voteTranslation(translations, locale, v.id)
    const titled = requireVoteCleanTitle({
      id: v.id,
      title: translatedVote?.title ?? translatedVote?.clean_title ?? v.title,
      cleanTitle: translatedVote?.clean_title ?? v.clean_title,
    })
    proposalsTotal += 1
    if (v.result === 'angenommen') proposalsAccepted += 1
    proposals.push({ voteId: v.id, date: v.date, title: titled.title, cleanTitle: titled.cleanTitle, result: v.result })
  }
  proposals.sort((a, b) => b.date.localeCompare(a.date))
  const donationNames = DONATION_PARTY_NAMES[party] ?? [party]
  const placeholders = donationNames.map(() => '?').join(', ')
  const donationRows = db.prepare(`
    SELECT id, donor, amount_eur, date_received FROM party_donations
    WHERE party IN (${placeholders})
    ORDER BY amount_eur DESC
  `).all(...donationNames) as DonationRow[]
  return {
    slug,
    party,
    seats: voteRows[0]?.members ?? 0,
    cohesion: namentlich.reduce((a, s) => a + cohesion(s), 0) / Math.max(namentlich.length, 1),
    attendance: namentlich.reduce((a, s) => a + attendance(s), 0) / Math.max(namentlich.length, 1),
    successRate: success.decided ? success.matched / success.decided : 0,
    proposalsTotal,
    proposalsAccepted,
    proposals,
    donations: donationRows.map((d) => ({
      id: d.id, donor: d.donor, amountEur: d.amount_eur, dateReceived: d.date_received,
    })),
    donationsTotalEur: donationRows.reduce((a, d) => a + d.amount_eur, 0),
    donationsCount: donationRows.length,
    votes: voteRows,
    members: memberRows,
    alignments,
    history: partyHistory(db, party),
  }
}
