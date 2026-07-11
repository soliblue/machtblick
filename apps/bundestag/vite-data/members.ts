import type Database from 'better-sqlite3'
import type { MemberDetail, MemberVoteChoice, MemberVoteRow } from '../src/server/memberDetail'
import { requireVoteCleanTitle, requireVoteTitleText } from '../src/lib/voteTitles'
import { resolvePictureUrl } from '../src/server/photoManifest'
import {
  speechTranslation,
  voteTranslation,
  type StaticLocale,
  type StaticTranslations,
} from './translations'

type MemberRow = {
  id: string
  name: string
  picture_url: string | null
  picture_author: string | null
  picture_license: string | null
  picture_source_url: string | null
  mandate_type: string | null
  list_state: string | null
  constituency_number: string | null
  constituency_name: string | null
}

type MandateType = 'direkt' | 'liste'

function normalizeMandate(raw: string | null): MandateType | null {
  return raw === 'direkt' || raw === 'liste' ? raw : null
}

type DemographicsRow = {
  member_id: string
  year_of_birth: number | null
  sex: string | null
}

type Sex = 'm' | 'f' | 'd'

function normalizeSex(raw: string | null): Sex | null {
  return raw === 'm' || raw === 'f' || raw === 'd' ? raw : null
}

function loadDemographicsMap(db: Database.Database) {
  const rows = db.prepare(`
    SELECT member_id,
           json_extract(raw_json, '$.year_of_birth') AS year_of_birth,
           json_extract(raw_json, '$.sex') AS sex
    FROM member_abgeordnetenwatch
  `).all() as DemographicsRow[]
  const out = new Map<string, { yearOfBirth: number | null; sex: Sex | null }>()
  for (const row of rows) out.set(row.member_id, { yearOfBirth: row.year_of_birth ?? null, sex: normalizeSex(row.sex) })
  return out
}

type VoteMemberRow = {
  vote_id: string
  member_id: string
  state: string
  choice: MemberVoteChoice
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
}

type AffiliationRow = {
  member_id: string
  party: string
  valid_from: string
  valid_to: string | null
}

type SpeechJoinRow = {
  id: string
  speaker_name: string
  speaker_member_id: string | null
  speaker_role: string | null
  party: string | null
  position: number
  text_excerpt: string
  date: string
  agenda_item: string | null
  agenda_title: string | null
  debate_group_id: string | null
  contribution_type: string | null
  vote_id: string | null
  vote_clean_title: string | null
}

export type MemberBuildData = {
  majorityByVoteParty: Map<string, MemberVoteChoice>
  summariesByVote: Map<string, MemberVoteRow['partySummaries']>
  translations: StaticTranslations
}

const PARTY_LINE_EXCLUDED = new Set(['fraktionslos', 'Bundesregierung'])
const CURRENT_TERM = 21

function partyAt(affiliations: AffiliationRow[], date: string): string {
  return affiliations.find((row) => row.valid_from <= date && (row.valid_to === null || row.valid_to >= date))?.party ?? ''
}

function majorityChoice(summary: SummaryRow): MemberVoteChoice {
  return ([
    ['ja', summary.yes ?? 0],
    ['nein', summary.no ?? 0],
    ['enthalten', summary.abstain ?? 0],
    ['nicht_abgegeben', summary.absent ?? 0],
  ] as const).reduce((a, b) => (b[1] > a[1] ? b : a))[0]
}

export function loadMemberBuildData(db: Database.Database, translations: StaticTranslations): MemberBuildData {
  const majorityByVoteParty = new Map<string, MemberVoteChoice>()
  const summariesByVote = new Map<string, MemberVoteRow['partySummaries']>()
  for (const summary of db.prepare(`
    SELECT vps.vote_id, vps.party, vps.position, vps.members, vps.yes, vps.no, vps.abstain, vps.absent
    FROM vote_party_summaries vps
    INNER JOIN votes v ON v.id = vps.vote_id
    WHERE v.term_id = ${CURRENT_TERM}
  `).all() as SummaryRow[]) {
    majorityByVoteParty.set(`${summary.vote_id} ${summary.party}`, majorityChoice(summary))
    const rows = summariesByVote.get(summary.vote_id) ?? []
    rows.push({
      party: summary.party,
      position: summary.position,
      members: summary.members ?? 0,
      yes: summary.yes ?? 0,
      no: summary.no ?? 0,
      abstain: summary.abstain ?? 0,
      absent: summary.absent ?? 0,
    })
    summariesByVote.set(summary.vote_id, rows)
  }
  return { majorityByVoteParty, summariesByVote, translations }
}

export function leanMembers(db: Database.Database, data: MemberBuildData) {
  const allMembers = db.prepare('SELECT id, name, mandate_type FROM members').all() as Array<Pick<MemberRow, 'id' | 'name' | 'mandate_type'>>
  const voteDate = new Map(
    (db.prepare(`SELECT id, date FROM votes WHERE term_id = ${CURRENT_TERM} AND procedural = 0`).all() as Array<{ id: string; date: string }>).map((vote) => [vote.id, vote.date]),
  )
  const voteMembers = (db.prepare('SELECT vote_id, member_id, state, choice FROM vote_members').all() as VoteMemberRow[])
    .filter((row) => voteDate.has(row.vote_id))
  const currentParty = new Map(
    (db.prepare(`SELECT member_id, party FROM member_affiliations WHERE term_id = ${CURRENT_TERM} AND valid_to IS NULL`).all() as Array<{ member_id: string; party: string }>).map((row) => [row.member_id, row.party]),
  )
  const affiliationsByMember = new Map<string, AffiliationRow[]>()
  for (const affiliation of db.prepare(`SELECT member_id, party, valid_from, valid_to FROM member_affiliations WHERE term_id = ${CURRENT_TERM}`).all() as AffiliationRow[]) {
    const rows = affiliationsByMember.get(affiliation.member_id) ?? []
    rows.push(affiliation)
    affiliationsByMember.set(affiliation.member_id, rows)
  }
  const ballotsByMember = new Map<string, Array<{ voteId: string; date: string; choice: MemberVoteChoice }>>()
  const stateByMember = new Map<string, string>()
  for (const row of voteMembers) {
    if (!stateByMember.has(row.member_id)) stateByMember.set(row.member_id, row.state)
    const ballots = ballotsByMember.get(row.member_id) ?? []
    ballots.push({ voteId: row.vote_id, date: voteDate.get(row.vote_id)!, choice: row.choice })
    ballotsByMember.set(row.member_id, ballots)
  }
  const demographics = loadDemographicsMap(db)
  return allMembers
    .filter((member) => ballotsByMember.has(member.id))
    .map((member) => {
      const demo = demographics.get(member.id)
      const ballots = ballotsByMember.get(member.id)!
      const affiliations = affiliationsByMember.get(member.id) ?? []
      let absent = 0
      let loyalMatches = 0
      let loyalEligible = 0
      for (const ballot of ballots) {
        const party = partyAt(affiliations, ballot.date)
        const eligible = !!party && !PARTY_LINE_EXCLUDED.has(party)
        if (ballot.choice === 'nicht_abgegeben') absent++
        else if (eligible) {
          loyalEligible++
          if (ballot.choice === (data.majorityByVoteParty.get(`${ballot.voteId} ${party}`) ?? '')) loyalMatches++
        }
      }
      return {
        id: member.id,
        name: member.name,
        party: currentParty.get(member.id) ?? '',
        state: stateByMember.get(member.id) ?? '',
        yearOfBirth: demo?.yearOfBirth ?? null,
        sex: demo?.sex ?? null,
        mandateType: normalizeMandate(member.mandate_type),
        attendance: 1 - absent / ballots.length,
        loyalty: loyalEligible > 0 ? loyalMatches / loyalEligible : null,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
}

export function fullMember(
  db: Database.Database,
  id: string,
  locale: StaticLocale,
  data: MemberBuildData,
): MemberDetail {
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as MemberRow
  const demographics = db.prepare(`
    SELECT json_extract(raw_json, '$.year_of_birth') AS year_of_birth,
           json_extract(raw_json, '$.sex') AS sex,
           json_extract(raw_json, '$.education') AS education,
           json_extract(raw_json, '$.abgeordnetenwatch_url') AS aw_profile_url,
           json_extract(raw_json, '$.qid_wikidata') AS wikidata_qid
    FROM member_abgeordnetenwatch
    WHERE member_id = ?
  `).get(id) as {
    year_of_birth: number | null
    sex: string | null
    education: string | null
    aw_profile_url: string | null
    wikidata_qid: string | null
  } | undefined
  const voteRows = db.prepare(`
    SELECT vm.vote_id, vm.state, vm.choice, v.date, v.title, v.clean_title, v.result, v.initiator
    FROM vote_members vm
    INNER JOIN votes v ON v.id = vm.vote_id
    WHERE vm.member_id = ? AND v.term_id = ${CURRENT_TERM} AND v.procedural = 0
    ORDER BY v.date DESC
  `).all(id) as Array<{
    vote_id: string
    state: string
    choice: MemberVoteChoice
    date: string
    title: string
    clean_title: string | null
    result: 'angenommen' | 'abgelehnt'
    initiator: string | null
  }>
  const affiliations = db.prepare(`
    SELECT member_id, party, valid_from, valid_to
    FROM member_affiliations
    WHERE term_id = ${CURRENT_TERM} AND member_id = ?
  `).all(id) as AffiliationRow[]
  let absent = 0
  let loyalMatches = 0
  let loyalEligible = 0
  let defections = 0
  const history: MemberVoteRow[] = voteRows.map((row) => {
    const translated = voteTranslation(data.translations, locale, row.vote_id)
    const titled = requireVoteCleanTitle({
      id: row.vote_id,
      title: row.title,
      cleanTitle: translated?.clean_title ?? row.clean_title,
    })
    const party = partyAt(affiliations, row.date)
    const majority = data.majorityByVoteParty.get(`${row.vote_id} ${party}`) ?? ''
    const eligible = !!party && !PARTY_LINE_EXCLUDED.has(party)
    const defected = row.choice === 'nicht_abgegeben' ? false : eligible ? row.choice !== majority : null
    if (row.choice === 'nicht_abgegeben') absent++
    else if (eligible) {
      loyalEligible++
      if (row.choice === majority) loyalMatches++
      else defections++
    }
    return {
      voteId: row.vote_id,
      date: row.date,
      title: titled.title,
      cleanTitle: titled.cleanTitle,
      result: row.result,
      choice: row.choice,
      party,
      partyMajority: majority,
      defected,
      proposingParty: row.initiator,
      partySummaries: data.summariesByVote.get(row.vote_id) ?? [],
    }
  })
  const speechRows = db.prepare(`
    WITH linked_votes AS (
      SELECT speech_id, vote_id, row_number() OVER (
        PARTITION BY speech_id
        ORDER BY confidence DESC, CASE source WHEN 'direct' THEN 0 ELSE 1 END, vote_id
      ) AS rn
      FROM speech_vote_links
    )
    SELECT s.id, s.speaker_name, s.speaker_member_id, s.speaker_role, s.party,
           COALESCE(sdgs.position, s.position) AS position,
           s.text_excerpt, s.date, s.agenda_item,
           COALESCE(sdg.title, pai.title) AS agenda_title,
           sdgs.group_id AS debate_group_id,
           sdgs.contribution_type AS contribution_type,
           v.id AS vote_id,
           v.clean_title AS vote_clean_title
    FROM speeches s
    LEFT JOIN linked_votes lv ON lv.speech_id = s.id AND lv.rn = 1
    LEFT JOIN votes v ON v.id = lv.vote_id AND v.term_id = ${CURRENT_TERM} AND v.procedural = 0 AND v.vote_type != 'hammelsprung'
    LEFT JOIN speech_debate_group_speeches sdgs ON sdgs.speech_id = s.id
    LEFT JOIN speech_debate_groups sdg ON sdg.id = sdgs.group_id
    LEFT JOIN plenary_agenda_items pai ON pai.session_id = s.session_id AND pai.date = s.date AND pai.agenda_item = s.agenda_item
    WHERE s.speaker_member_id = ?
    ORDER BY s.date DESC, COALESCE(sdgs.position, s.position) ASC
  `).all(id) as SpeechJoinRow[]
  return {
    id,
    name: member.name,
    party: affiliations.find((row) => row.valid_to === null)?.party ?? '',
    state: voteRows[0]?.state ?? '',
    attendance: voteRows.length ? 1 - absent / voteRows.length : 0,
    loyalty: loyalEligible > 0 ? loyalMatches / loyalEligible : null,
    votesAppeared: voteRows.length,
    defections,
    history,
    speeches: speechRows.map((row) => ({
      id: row.id,
      speakerName: row.speaker_name,
      speakerMemberId: row.speaker_member_id,
      speakerRole: row.speaker_role,
      party: row.party,
      position: row.position,
      excerpt: speechTranslation(data.translations, locale, row.id)?.text_excerpt ?? row.text_excerpt,
      date: row.date,
      agendaItem: row.agenda_item,
      agendaTitle: row.agenda_title,
      debateGroupId: row.debate_group_id,
      contributionType: row.contribution_type,
      voteId: row.vote_id,
      voteTitle: requireVoteTitleText(
        row.vote_id,
        row.vote_id
          ? voteTranslation(data.translations, locale, row.vote_id)?.clean_title ?? row.vote_clean_title
          : null,
      ),
      snippet: null,
    })),
    pictureUrl: resolvePictureUrl(id, member.picture_url),
    pictureAuthor: member.picture_author,
    pictureLicense: member.picture_license,
    pictureSourceUrl: member.picture_source_url,
    yearOfBirth: demographics?.year_of_birth ?? null,
    sex: normalizeSex(demographics?.sex ?? null),
    education: demographics?.education ?? null,
    sameAs: [
      ...(demographics?.aw_profile_url ? [demographics.aw_profile_url] : []),
      ...(demographics?.wikidata_qid ? [`https://www.wikidata.org/wiki/${demographics.wikidata_qid}`] : []),
    ],
    mandateType: normalizeMandate(member.mandate_type),
    listState: member.list_state,
    constituencyNumber: member.constituency_number,
    constituencyName: member.constituency_name,
  }
}
