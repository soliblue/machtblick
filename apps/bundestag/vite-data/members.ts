import type Database from 'better-sqlite3'
import { requireVoteCleanTitle, requireVoteTitleText } from '../src/lib/voteTitles'

type MemberRow = {
  id: string
  name: string
  first_name: string
  last_name: string
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
  for (const r of rows) out.set(r.member_id, { yearOfBirth: r.year_of_birth ?? null, sex: normalizeSex(r.sex) })
  return out
}

type VoteMemberRow = {
  vote_id: string
  member_id: string
  state: string
  choice: string
}

type SummaryRow = {
  vote_id: string
  party: string
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

type VoteRow = {
  id: string
  date: string
  title: string
  clean_title: string | null
  result: 'angenommen' | 'abgelehnt'
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
  vote_title: string | null
  vote_clean_title: string | null
}

const PARTY_LINE_EXCLUDED = new Set(['fraktionslos', 'Bundesregierung'])
const CURRENT_TERM = 21

function partyAt(affiliations: AffiliationRow[], date: string): string {
  const hit = affiliations.find((a) => a.valid_from <= date && (a.valid_to === null || a.valid_to >= date))
  return hit?.party ?? ''
}

function majorityChoice(s: SummaryRow): string {
  const c = [
    ['ja', s.yes ?? 0],
    ['nein', s.no ?? 0],
    ['enthalten', s.abstain ?? 0],
    ['nicht_abgegeben', s.absent ?? 0],
  ] as const
  return c.reduce((a, b) => (b[1] > a[1] ? b : a), c[0])[0]
}

export function leanMembers(db: Database.Database) {
  const allMembers = db.prepare('SELECT id, name, mandate_type FROM members').all() as Array<Pick<MemberRow, 'id' | 'name' | 'mandate_type'>>
  const nonProceduralVoteIds = new Set(
    (db.prepare(`SELECT id FROM votes WHERE term_id = ${CURRENT_TERM} AND procedural = 0`).all() as Array<{ id: string }>).map((v) => v.id),
  )
  const vmRows = (db.prepare('SELECT vote_id, member_id, state FROM vote_members').all() as VoteMemberRow[])
    .filter((r) => nonProceduralVoteIds.has(r.vote_id))
  const affiliations = db.prepare(`SELECT member_id, party, valid_from, valid_to FROM member_affiliations WHERE term_id = ${CURRENT_TERM} AND valid_to IS NULL`).all() as AffiliationRow[]
  const currentParty = new Map(affiliations.map((a) => [a.member_id, a.party]))
  const stateByMember = new Map<string, string>()
  for (const r of vmRows) if (!stateByMember.has(r.member_id)) stateByMember.set(r.member_id, r.state)
  const hasVotes = new Set(vmRows.map((r) => r.member_id))
  const demographics = loadDemographicsMap(db)
  return allMembers
    .filter((m) => hasVotes.has(m.id))
    .map((m) => {
      const demo = demographics.get(m.id)
      return {
        id: m.id,
        name: m.name,
        party: currentParty.get(m.id) ?? '',
        state: stateByMember.get(m.id) ?? '',
        yearOfBirth: demo?.yearOfBirth ?? null,
        sex: demo?.sex ?? null,
        mandateType: normalizeMandate(m.mandate_type),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
}

export function fullMember(db: Database.Database, id: string) {
  const m = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as MemberRow
  const demoRow = db.prepare(`
    SELECT json_extract(raw_json, '$.year_of_birth') AS year_of_birth,
           json_extract(raw_json, '$.sex') AS sex
    FROM member_abgeordnetenwatch
    WHERE member_id = ?
  `).get(id) as { year_of_birth: number | null; sex: string | null } | undefined
  const yearOfBirth = demoRow?.year_of_birth ?? null
  const sex = normalizeSex(demoRow?.sex ?? null)
  const vmRows = db.prepare(`
    SELECT vm.vote_id, vm.state, vm.choice, v.date, v.title, v.clean_title, v.result
    FROM vote_members vm
    INNER JOIN votes v ON v.id = vm.vote_id
    WHERE vm.member_id = ? AND v.term_id = ${CURRENT_TERM} AND v.procedural = 0
    ORDER BY v.date DESC
  `).all(id) as Array<{ vote_id: string; state: string; choice: string; date: string; title: string; clean_title: string | null; result: 'angenommen' | 'abgelehnt' }>
  const affiliations = db.prepare(`SELECT member_id, party, valid_from, valid_to FROM member_affiliations WHERE term_id = ${CURRENT_TERM} AND member_id = ?`).all(id) as AffiliationRow[]
  const allSummaries = db.prepare(`
    SELECT vps.vote_id, vps.party, vps.yes, vps.no, vps.abstain, vps.absent
    FROM vote_party_summaries vps
    INNER JOIN votes v ON v.id = vps.vote_id
    WHERE v.term_id = ${CURRENT_TERM}
  `).all() as SummaryRow[]
  const majByVoteParty = new Map<string, string>()
  for (const s of allSummaries) majByVoteParty.set(`${s.vote_id} ${s.party}`, majorityChoice(s))
  let absent = 0
  let loyalMatches = 0
  let loyalEligible = 0
  let defections = 0
  const history = vmRows.map((r) => {
    const titled = requireVoteCleanTitle({ id: r.vote_id, title: r.title, cleanTitle: r.clean_title })
    const party = partyAt(affiliations, r.date)
    const maj = majByVoteParty.get(`${r.vote_id} ${party}`) ?? ''
    const eligible = !!party && !PARTY_LINE_EXCLUDED.has(party)
    const defected = r.choice === 'nicht_abgegeben' ? false : eligible ? r.choice !== maj : null
    if (r.choice === 'nicht_abgegeben') absent++
    else if (eligible) {
      loyalEligible++
      if (r.choice === maj) loyalMatches++
      else defections++
    }
    return {
      voteId: r.vote_id,
      date: r.date,
      title: titled.title,
      cleanTitle: titled.cleanTitle,
      result: r.result,
      choice: r.choice,
      party,
      partyMajority: maj,
      defected,
    }
  })
  const currentParty = affiliations.find((a) => a.valid_to === null)?.party ?? ''
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
           v.title AS vote_title,
           v.clean_title AS vote_clean_title
    FROM speeches s
    LEFT JOIN linked_votes lv ON lv.speech_id = s.id AND lv.rn = 1
    LEFT JOIN votes v ON v.id = lv.vote_id AND v.term_id = 21 AND v.procedural = 0 AND v.vote_type != 'hammelsprung'
    LEFT JOIN speech_debate_group_speeches sdgs ON sdgs.speech_id = s.id
    LEFT JOIN speech_debate_groups sdg ON sdg.id = sdgs.group_id
    LEFT JOIN plenary_agenda_items pai ON pai.session_id = s.session_id AND pai.date = s.date AND pai.agenda_item = s.agenda_item
    WHERE s.speaker_member_id = ?
    ORDER BY s.date DESC, COALESCE(sdgs.position, s.position) ASC
  `).all(id) as SpeechJoinRow[]
  const speeches = speechRows.map((row) => ({
    id: row.id,
    speakerName: row.speaker_name,
    speakerMemberId: row.speaker_member_id,
    speakerRole: row.speaker_role,
    party: row.party,
    position: row.position,
    excerpt: row.text_excerpt,
    date: row.date,
    agendaItem: row.agenda_item,
    agendaTitle: row.agenda_title,
    debateGroupId: row.debate_group_id,
    contributionType: row.contribution_type,
    voteId: row.vote_id,
    voteTitle: requireVoteTitleText(row.vote_id, row.vote_clean_title),
    snippet: null,
  }))
  return {
    id,
    name: m.name,
    party: currentParty,
    state: vmRows[0]?.state ?? '',
    attendance: vmRows.length ? 1 - absent / vmRows.length : 0,
    loyalty: loyalEligible > 0 ? loyalMatches / loyalEligible : null,
    votesAppeared: vmRows.length,
    defections,
    history,
    speeches,
    pictureUrl: m.picture_url,
    pictureAuthor: m.picture_author,
    pictureLicense: m.picture_license,
    pictureSourceUrl: m.picture_source_url,
    yearOfBirth,
    sex,
    mandateType: normalizeMandate(m.mandate_type),
    listState: m.list_state,
    constituencyNumber: m.constituency_number,
    constituencyName: m.constituency_name,
  }
}
