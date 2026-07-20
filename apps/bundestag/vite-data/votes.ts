import type Database from 'better-sqlite3'
import type { Locale } from '../src/lib/locale'
import { hasPartyLine } from '../src/lib/parties'
import { compareVotesNewest } from '../src/lib/voteOrdering'
import { majorityChoice, type PartyMajority } from '../src/server/majorityChoice'
import { resolvePictureUrl } from '../src/server/photoManifest'
import { isRelatedDebate } from '../src/server/speechVoteSql'
import { CURRENT_TERM } from '../src/server/term'
import { requireVoteCleanTitle } from '../src/lib/voteTitles'
import { partyAt, type AffiliationRow } from './affiliations'
import {
  partySummaryTranslation,
  speechTranslation,
  voteTranslation,
  type StaticTranslations,
} from './translations'

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

export type VoteBuildData = {
  affiliationsByMember: Map<string, AffiliationRow[]>
  translations: StaticTranslations
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

export function loadVoteBuildData(db: Database.Database, translations: StaticTranslations): VoteBuildData {
  const affiliationsByMember = new Map<string, AffiliationRow[]>()
  for (const affiliation of db.prepare('SELECT member_id, party, valid_from, valid_to FROM member_affiliations').all() as AffiliationRow[]) {
    const rows = affiliationsByMember.get(affiliation.member_id) ?? []
    rows.push(affiliation)
    affiliationsByMember.set(affiliation.member_id, rows)
  }
  return { affiliationsByMember, translations }
}

export function leanVotes(db: Database.Database, locale: Locale, data: VoteBuildData) {
  const rows = db.prepare(`
    SELECT id, date, title, clean_title, topic, summary_simplified, initiator, result, yes, no, abstain, absent, vote_type, bundestag_id
    FROM votes WHERE term_id = ${CURRENT_TERM} AND procedural = 0 AND is_petition_bundle = 0 AND vote_type != 'hammelsprung'
    ORDER BY date DESC, bundestag_id DESC
  `).all() as Array<Pick<VoteRow, 'id' | 'date' | 'title' | 'clean_title' | 'topic' | 'summary_simplified' | 'initiator' | 'result' | 'yes' | 'no' | 'abstain' | 'absent' | 'vote_type' | 'bundestag_id'>>
  rows.sort(compareVotesNewest)
  const allSummaries = db.prepare('SELECT vote_id, party, position, members, yes, no, abstain, absent FROM vote_party_summaries').all() as SummaryRow[]
  const byVote = new Map<string, SummaryRow[]>()
  for (const s of allSummaries) {
    const arr = byVote.get(s.vote_id) ?? []
    arr.push(s)
    byVote.set(s.vote_id, arr)
  }
  return rows.map((v) => {
    const translated = voteTranslation(data.translations, locale, v.id)
    const titled = requireVoteCleanTitle({ id: v.id, title: translated?.title ?? translated?.clean_title ?? v.title, cleanTitle: translated?.clean_title ?? v.clean_title })
    const partySummaries = (byVote.get(v.id) ?? []).map((s) => ({
      party: s.party, position: s.position, members: s.members ?? 0, yes: s.yes ?? 0, no: s.no ?? 0, abstain: s.abstain ?? 0, absent: s.absent ?? 0,
    }))
    const base = {
      id: v.id, title: titled.title, cleanTitle: titled.cleanTitle, date: v.date,
      result: v.result, initiator: v.initiator,
      voteType: v.vote_type,
      topic: translated?.topic ?? v.topic,
      summarySimplified: translated?.summary_simplified ?? v.summary_simplified,
      partySummaries,
    }
    if (v.vote_type === 'namentlich' && v.yes != null) {
      return { ...base, yes: v.yes, no: v.no!, abstain: v.abstain!, absent: v.absent! }
    }
    return {
      ...base,
      yes: partySummaries.reduce((a, s) => a + s.yes, 0),
      no: partySummaries.reduce((a, s) => a + s.no, 0),
      abstain: partySummaries.reduce((a, s) => a + s.abstain, 0),
      absent: 0,
    }
  })
}

export function fullVote(db: Database.Database, id: string, locale: Locale, data: VoteBuildData) {
  const voteRow = db.prepare('SELECT * FROM votes WHERE id = ?').get(id) as VoteRow
  const translatedVote = voteTranslation(data.translations, locale, id)
  const documents = db.prepare('SELECT * FROM vote_documents WHERE vote_id = ?').all(id) as DocumentRow[]
  const summaryRows = db.prepare('SELECT * FROM vote_party_summaries WHERE vote_id = ?').all(id) as SummaryRow[]
  const partySummaries = summaryRows.map((s) => {
    const translatedSummary = partySummaryTranslation(data.translations, locale, s.vote_id, s.party)
    return {
      voteId: s.vote_id, party: s.party, position: s.position,
      members: s.members ?? 0, yes: s.yes ?? 0, no: s.no ?? 0, abstain: s.abstain ?? 0, absent: s.absent ?? 0,
      positionSummary: translatedSummary?.position_summary ?? s.position_summary,
      keyPoints: translatedSummary?.key_points ?? s.key_points,
      dissentNote: translatedSummary?.dissent_note ?? s.dissent_note,
    }
  })
  const counts = voteRow.vote_type === 'namentlich'
    ? { totalMembers: voteRow.total_members ?? 0, yes: voteRow.yes ?? 0, no: voteRow.no ?? 0, abstain: voteRow.abstain ?? 0, absent: voteRow.absent ?? 0 }
    : (() => {
        const yes = partySummaries.reduce((a, s) => a + s.yes, 0)
        const no = partySummaries.reduce((a, s) => a + s.no, 0)
        const abstain = partySummaries.reduce((a, s) => a + s.abstain, 0)
        return { totalMembers: yes + no + abstain, yes, no, abstain, absent: 0 }
      })()
  const vote = requireVoteCleanTitle({
    id: voteRow.id, bundestagId: null as number | null, voteType: voteRow.vote_type, date: voteRow.date,
    agendaItem: voteRow.agenda_item, title: translatedVote?.title ?? translatedVote?.clean_title ?? voteRow.title, cleanTitle: translatedVote?.clean_title ?? voteRow.clean_title,
    topic: translatedVote?.topic ?? voteRow.topic,
    subject: translatedVote?.subject ?? voteRow.subject,
    summary: translatedVote?.summary ?? voteRow.summary,
    summarySimplified: translatedVote?.summary_simplified ?? voteRow.summary_simplified,
    summaryDetail: translatedVote?.summary_detail ?? voteRow.summary_detail,
    document: voteRow.document, initiator: voteRow.initiator,
    result: voteRow.result, procedural: false, inverted: !!voteRow.inverted, isPetitionBundle: !!voteRow.is_petition_bundle,
    ...counts, sourceUrl: voteRow.source_url,
    contextJson: voteRow.context_json, procedureJson: voteRow.procedure_json, fetchedAt: '',
  })
  const rawVmRows = db.prepare(`
    SELECT vm.member_id, vm.choice, m.name, m.picture_url, vm.state
    FROM vote_members vm
    INNER JOIN members m ON m.id = vm.member_id
    WHERE vm.vote_id = ?
  `).all(id) as VoteMemberRow[]
  const vmRows = rawVmRows.map((r) => ({ ...r, party: partyAt(data.affiliationsByMember.get(r.member_id), voteRow.date) }))
  const majorityByParty = new Map<string, PartyMajority>()
  for (const s of partySummaries) {
    const maj = majorityChoice(s)
    if (maj) majorityByParty.set(s.party, maj)
  }
  const defectorsByParty = new Map<string, Array<{ id: string; name: string; choice: string; pictureUrl: string | null }>>()
  for (const r of vmRows) {
    if (!hasPartyLine(r.party)) continue
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
    excerpt: speechTranslation(data.translations, locale, r.id)?.text_excerpt ?? r.text_excerpt,
  }))
  const debateSource = speechRows.some((r) => isRelatedDebate(r, voteRow.date)) ? 'related' : 'direct'
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

