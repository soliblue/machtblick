import type Database from 'better-sqlite3'
import { compareVotesNewest } from '../src/lib/voteOrdering'
import { resolvePictureUrl } from '../src/server/photoManifest'
import { requireVoteCleanTitle } from '../src/lib/voteTitles'

type VoteRow = {
  id: string
  date: string
  agenda_item: string | null
  title: string
  clean_title: string | null
  topic: string | null
  vote_type: 'namentlich' | 'handzeichen' | 'hammelsprung'
  bundestag_id: number | null
  initiator: string | null
  result: 'angenommen' | 'abgelehnt'
  yes: number | null
  no: number | null
  abstain: number | null
  absent: number | null
  total_members: number | null
  subject: string | null
  summary: string | null
  summary_simplified: string | null
  summary_detail: string | null
  document: string | null
  source_url: string
  inverted: number
  is_petition_bundle: number
  procedure_json: string | null
  context_json: string | null
}

type SummaryRow = {
  vote_id: string
  party: string
  position: 'yes' | 'no' | 'abstain' | 'mixed'
  members: number | null
  yes: number | null
  no: number | null
  abstain: number | null
  absent: number | null
  position_summary: string | null
  key_points: string | null
  dissent_note: string | null
}

type DocumentRow = {
  id: number
  vote_id: string
  label: string
  title: string
  url: string
}

type VoteMemberRow = {
  member_id: string
  choice: string
  name: string
  picture_url: string | null
  state: string
}

type AffiliationRow = {
  member_id: string
  party: string
  valid_from: string
  valid_to: string | null
}

type SpeechRow = {
  id: string
  speaker_name: string
  speaker_member_id: string | null
  speaker_role: string | null
  party: string | null
  date: string
  agenda_item: string | null
  agenda_title: string | null
  debate_group_id: string | null
  contribution_type: string | null
  position: number
  text_excerpt: string
  debate_source: string | null
}

type DescriptionDecisionRow = {
  source_pdf_url: string
}

const PARTY_LINE_EXCLUDED = new Set(['fraktionslos', 'Bundesregierung'])
const CURRENT_TERM = 21

function partyAt(affiliations: AffiliationRow[], date: string): string {
  const hit = affiliations.find((a) => a.valid_from <= date && (a.valid_to === null || a.valid_to >= date))
  return hit?.party ?? ''
}

export function leanVotes(db: Database.Database) {
  const rows = db.prepare(`
    SELECT id, date, title, clean_title, topic, summary_simplified, initiator, result, yes, no, abstain, absent, vote_type, bundestag_id
    FROM votes WHERE term_id = ${CURRENT_TERM} AND procedural = 0 AND vote_type != 'hammelsprung'
    ORDER BY date DESC, bundestag_id DESC
  `).all() as Array<Pick<VoteRow, 'id' | 'date' | 'title' | 'clean_title' | 'topic' | 'summary_simplified' | 'initiator' | 'result' | 'yes' | 'no' | 'abstain' | 'absent' | 'vote_type' | 'bundestag_id'>>
  rows.sort(compareVotesNewest)
  const allSummaries = db.prepare('SELECT vote_id, party, position, members, yes, no, abstain, absent FROM vote_party_summaries').all() as SummaryRow[]
  const seatsByParty = new Map<string, number>()
  const byVote = new Map<string, SummaryRow[]>()
  for (const s of allSummaries) {
    const arr = byVote.get(s.vote_id) ?? []
    arr.push(s)
    byVote.set(s.vote_id, arr)
  }
  for (const r of rows) {
    if (r.vote_type !== 'namentlich') continue
    for (const s of byVote.get(r.id) ?? []) {
      if (s.members && !seatsByParty.has(s.party)) seatsByParty.set(s.party, s.members)
    }
    if (seatsByParty.size >= 6) break
  }
  return rows.map((v) => {
    const titled = requireVoteCleanTitle({ id: v.id, title: v.title, cleanTitle: v.clean_title })
    const summaries = byVote.get(v.id) ?? []
    const partySummaries = summaries.map((s) =>
      v.vote_type === 'namentlich'
        ? { party: s.party, position: s.position, yes: s.yes ?? 0, no: s.no ?? 0, abstain: s.abstain ?? 0, absent: s.absent ?? 0 }
        : { party: s.party, position: s.position, yes: 0, no: 0, abstain: 0, absent: 0 },
    )
    const base = {
      id: v.id, title: titled.title, cleanTitle: titled.cleanTitle, date: v.date,
      result: v.result, initiator: v.initiator,
      voteType: v.vote_type, topic: v.topic, summarySimplified: v.summary_simplified,
      partySummaries,
    }
    if (v.vote_type === 'namentlich' && v.yes != null) {
      return { ...base, yes: v.yes, no: v.no!, abstain: v.abstain!, absent: v.absent! }
    }
    let yes = 0, no = 0, abstain = 0
    for (const s of summaries) {
      const seats = seatsByParty.get(s.party) ?? 0
      if (s.position === 'yes') yes += seats
      else if (s.position === 'no') no += seats
      else if (s.position === 'abstain') abstain += seats
    }
    return { ...base, yes, no, abstain, absent: 0 }
  })
}

export function fullVote(db: Database.Database, id: string) {
  const voteRow = db.prepare('SELECT * FROM votes WHERE id = ?').get(id) as VoteRow
  const documents = db.prepare('SELECT * FROM vote_documents WHERE vote_id = ?').all(id) as DocumentRow[]
  const summaryRows = db.prepare('SELECT * FROM vote_party_summaries WHERE vote_id = ?').all(id) as SummaryRow[]
  const seats = latestSeatsByParty(db)
  const partySummaries = summaryRows.map((s) => {
    if (voteRow.vote_type === 'namentlich') {
      return {
        voteId: s.vote_id, party: s.party, position: s.position,
        members: s.members ?? 0, yes: s.yes ?? 0, no: s.no ?? 0, abstain: s.abstain ?? 0, absent: s.absent ?? 0,
        positionSummary: s.position_summary, keyPoints: s.key_points, dissentNote: s.dissent_note,
      }
    }
    const m = seats.get(s.party) ?? 0
    return {
      voteId: s.vote_id, party: s.party, position: s.position, members: m,
      yes: s.position === 'yes' ? m : 0,
      no: s.position === 'no' ? m : 0,
      abstain: s.position === 'abstain' ? m : 0,
      absent: 0,
      positionSummary: s.position_summary, keyPoints: s.key_points, dissentNote: s.dissent_note,
    }
  })
  const vote = voteRow.vote_type === 'namentlich'
    ? requireVoteCleanTitle({
        id: voteRow.id, bundestagId: null as number | null, voteType: voteRow.vote_type, date: voteRow.date,
        agendaItem: voteRow.agenda_item, title: voteRow.title, cleanTitle: voteRow.clean_title, topic: voteRow.topic,
        subject: voteRow.subject, summary: voteRow.summary, summarySimplified: voteRow.summary_simplified,
        summaryDetail: voteRow.summary_detail, document: voteRow.document, initiator: voteRow.initiator,
        result: voteRow.result, procedural: false, inverted: !!voteRow.inverted, isPetitionBundle: !!voteRow.is_petition_bundle,
        totalMembers: voteRow.total_members ?? 0, yes: voteRow.yes ?? 0, no: voteRow.no ?? 0,
        abstain: voteRow.abstain ?? 0, absent: voteRow.absent ?? 0, sourceUrl: voteRow.source_url,
        contextJson: voteRow.context_json, procedureJson: voteRow.procedure_json, fetchedAt: '',
      })
    : (() => {
        const yes = partySummaries.reduce((a, s) => a + s.yes, 0)
        const no = partySummaries.reduce((a, s) => a + s.no, 0)
        const abstain = partySummaries.reduce((a, s) => a + s.abstain, 0)
        return requireVoteCleanTitle({
          id: voteRow.id, bundestagId: null as number | null, voteType: voteRow.vote_type, date: voteRow.date,
          agendaItem: voteRow.agenda_item, title: voteRow.title, cleanTitle: voteRow.clean_title, topic: voteRow.topic,
          subject: voteRow.subject, summary: voteRow.summary, summarySimplified: voteRow.summary_simplified,
          summaryDetail: voteRow.summary_detail, document: voteRow.document, initiator: voteRow.initiator,
          result: voteRow.result, procedural: false, inverted: !!voteRow.inverted, isPetitionBundle: !!voteRow.is_petition_bundle,
          totalMembers: yes + no + abstain, yes, no, abstain, absent: 0, sourceUrl: voteRow.source_url,
          contextJson: voteRow.context_json, procedureJson: voteRow.procedure_json, fetchedAt: '',
        })
      })()
  const rawVmRows = db.prepare(`
    SELECT vm.member_id, vm.choice, m.name, m.picture_url, vm.state
    FROM vote_members vm
    INNER JOIN members m ON m.id = vm.member_id
    WHERE vm.vote_id = ?
  `).all(id) as VoteMemberRow[]
  const affiliations = db.prepare('SELECT member_id, party, valid_from, valid_to FROM member_affiliations').all() as AffiliationRow[]
  const affByMember = new Map<string, AffiliationRow[]>()
  for (const a of affiliations) {
    const arr = affByMember.get(a.member_id) ?? []
    arr.push(a)
    affByMember.set(a.member_id, arr)
  }
  const vmRows = rawVmRows.map((r) => ({ ...r, party: partyAt(affByMember.get(r.member_id) ?? [], voteRow.date) }))
  const majorityByParty = new Map<string, string>()
  for (const s of partySummaries) {
    const choices = [
      ['ja', s.yes],
      ['nein', s.no],
      ['enthalten', s.abstain],
      ['nicht_abgegeben', s.absent],
    ] as const
    majorityByParty.set(s.party, choices.reduce((a, b) => (b[1] > a[1] ? b : a))[0])
  }
  const defectorsByParty = new Map<string, Array<{ id: string; name: string; choice: string; pictureUrl: string | null }>>()
  for (const r of vmRows) {
    if (PARTY_LINE_EXCLUDED.has(r.party) || !r.party) continue
    const maj = majorityByParty.get(r.party)
    if (!maj || r.choice === maj || r.choice === 'nicht_abgegeben') continue
    const arr = defectorsByParty.get(r.party) ?? []
    arr.push({ id: r.member_id, name: r.name, choice: r.choice, pictureUrl: resolvePictureUrl(r.member_id, r.picture_url) })
    defectorsByParty.set(r.party, arr)
  }
  const defectors = Array.from(defectorsByParty.entries())
    .map(([party, list]) => ({ party, majority: majorityByParty.get(party)!, count: list.length, members: list }))
    .sort((a, b) => b.count - a.count)
  const speechRows = db.prepare(`
    SELECT s.id, s.speaker_name, s.speaker_member_id, s.speaker_role, s.party,
           s.date, s.agenda_item, COALESCE(sdg.title, pai.title) AS agenda_title,
           sdgs.group_id AS debate_group_id,
           sdgs.contribution_type AS contribution_type,
           COALESCE(sdgs.position, s.position) AS position,
           s.text_excerpt,
           vdg.source AS debate_source
    FROM vote_debate_groups vdg
    INNER JOIN speech_debate_group_speeches sdgs ON sdgs.group_id = vdg.group_id
    INNER JOIN speeches s ON s.id = sdgs.speech_id
    LEFT JOIN speech_debate_groups sdg ON sdg.id = sdgs.group_id
    LEFT JOIN plenary_agenda_items pai ON pai.session_id = s.session_id AND pai.date = s.date AND pai.agenda_item = s.agenda_item
    WHERE vdg.vote_id = ?
    ORDER BY COALESCE(sdg.date, s.date) ASC, COALESCE(sdgs.position, s.position) ASC
  `).all(id) as SpeechRow[]
  const debate = speechRows.map((r) => ({
    id: r.id,
    speakerName: r.speaker_name,
    speakerMemberId: r.speaker_member_id,
    speakerRole: r.speaker_role,
    party: r.party,
    date: r.date,
    agendaItem: r.agenda_item,
    agendaTitle: r.agenda_title,
    debateGroupId: r.debate_group_id,
    contributionType: r.contribution_type,
    position: r.position,
    excerpt: r.text_excerpt,
  }))
  const debateSource = speechRows.some((r) => r.debate_source === 'related' || r.date !== voteRow.date) ? 'related' : 'direct'
  const descRow = db.prepare('SELECT source_pdf_url FROM vote_description_decisions WHERE vote_id = ?').get(id) as DescriptionDecisionRow | undefined
  const antragPdfUrl = descRow?.source_pdf_url
    ?? (db.prepare(`
      SELECT vd.url
      FROM vote_document_roles vdr
      INNER JOIN vote_documents vd ON vd.id = vdr.document_id AND vd.vote_id = vdr.vote_id
      WHERE vdr.vote_id = ?
        AND vdr.role IN ('primary_antrag', 'antrag')
      ORDER BY CASE vdr.role WHEN 'primary_antrag' THEN 0 ELSE 1 END, vd.id
      LIMIT 1
    `).get(id) as { url: string } | undefined)?.url
    ?? null
  const linkedAntraege = db.prepare(`
    SELECT a.id, a.type, a.drucksache
    FROM vote_antraege va
    INNER JOIN antraege a ON a.id = va.antrag_id
    WHERE va.vote_id = ?
    ORDER BY a.id
  `).all(id) as Array<{ id: number; type: 'antrag' | 'gesetzentwurf'; drucksache: string | null }>
  return {
    vote,
    documents: documents.map((d) => ({
      id: d.id, voteId: d.vote_id, label: d.label, title: d.title, url: d.url,
    })),
    antraege: linkedAntraege.map((a) => ({ antragId: a.id, type: a.type, drucksache: a.drucksache })),
    partySummaries,
    proposingParty: vote.initiator,
    defectors,
    memberBallots: vmRows.map((r) => ({ memberId: r.member_id, name: r.name, party: r.party, choice: r.choice })),
    debate,
    debateSource,
    antragPdfUrl,
  }
}

function latestSeatsByParty(db: Database.Database): Map<string, number> {
  const out = new Map<string, number>()
  const namentlich = db.prepare(`
    SELECT id FROM votes WHERE term_id = ${CURRENT_TERM} AND vote_type = 'namentlich' ORDER BY date DESC LIMIT 20
  `).all() as Array<{ id: string }>
  for (const v of namentlich) {
    const rows = db.prepare('SELECT party, members FROM vote_party_summaries WHERE vote_id = ?').all(v.id) as Array<{ party: string; members: number | null }>
    for (const r of rows) if (r.members && !out.has(r.party)) out.set(r.party, r.members)
    if (out.size >= 6) break
  }
  return out
}
