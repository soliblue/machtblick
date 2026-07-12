import type Database from 'better-sqlite3'
import type { MemberDetail, MemberVoteChoice, MemberVoteRow } from '../src/server/memberDetail'
import { majorityChoice, type PartyMajority } from '../src/server/majorityChoice'
import type { Locale } from '../src/lib/locale'
import { hasPartyLine } from '../src/lib/parties'
import { parseMandate, parseSex } from '../src/lib/memberFacets'
import { requireVoteCleanTitle, requireVoteTitleText } from '../src/lib/voteTitles'
import { resolvePictureUrl } from '../src/server/photoManifest'
import { debateContextJoins, linkedVoteJoin, linkedVotesCte } from '../src/server/speechVoteSql'
import { CURRENT_TERM } from '../src/server/term'
import { partyAt, type AffiliationRow } from './affiliations'
import {
  speechTranslation,
  voteTranslation,
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

type DemographicsRow = {
  member_id: string
  year_of_birth: number | null
  sex: string | null
}

function loadDemographics(db: Database.Database) {
  const rows = db.prepare(`
    SELECT member_id,
           json_extract(raw_json, '$.year_of_birth') AS year_of_birth,
           json_extract(raw_json, '$.sex') AS sex
    FROM member_abgeordnetenwatch
  `).all() as DemographicsRow[]
  return new Map(rows.map((row) => [row.member_id, { yearOfBirth: row.year_of_birth ?? null, sex: parseSex(row.sex) }]))
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
  majorityByVoteParty: Map<string, PartyMajority>
  summariesByVote: Map<string, MemberVoteRow['partySummaries']>
  translations: StaticTranslations
}

export function loadMemberBuildData(db: Database.Database, translations: StaticTranslations): MemberBuildData {
  const majorityByVoteParty = new Map<string, PartyMajority>()
  const summariesByVote = new Map<string, MemberVoteRow['partySummaries']>()
  for (const summary of db.prepare(`
    SELECT vps.vote_id, vps.party, vps.position, vps.members, vps.yes, vps.no, vps.abstain, vps.absent
    FROM vote_party_summaries vps
    INNER JOIN votes v ON v.id = vps.vote_id
    WHERE v.term_id = ${CURRENT_TERM}
  `).all() as SummaryRow[]) {
    const maj = majorityChoice(summary)
    if (maj) majorityByVoteParty.set(`${summary.vote_id} ${summary.party}`, maj)
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
  const demographics = loadDemographics(db)
  return allMembers
    .filter((member) => ballotsByMember.has(member.id))
    .map((member) => {
      const demo = demographics.get(member.id)
      const ballots = ballotsByMember.get(member.id)!
      const affiliations = affiliationsByMember.get(member.id)
      let absent = 0
      let loyalMatches = 0
      let loyalEligible = 0
      for (const ballot of ballots) {
        const party = partyAt(affiliations, ballot.date)
        const maj = data.majorityByVoteParty.get(`${ballot.voteId} ${party}`)
        const eligible = hasPartyLine(party) && !!maj
        if (ballot.choice === 'nicht_abgegeben') absent++
        else if (eligible) {
          loyalEligible++
          if (ballot.choice === maj) loyalMatches++
        }
      }
      return {
        id: member.id,
        name: member.name,
        party: currentParty.get(member.id) ?? '',
        state: stateByMember.get(member.id) ?? '',
        yearOfBirth: demo?.yearOfBirth ?? null,
        sex: demo?.sex ?? null,
        mandateType: parseMandate(member.mandate_type),
        attendance: 1 - absent / ballots.length,
        loyalty: loyalEligible > 0 ? loyalMatches / loyalEligible : null,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
}

export function fullMember(
  db: Database.Database,
  id: string,
  locale: Locale,
  data: MemberBuildData,
): MemberDetail {
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as MemberRow
  const demoRow = db.prepare(`
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
    const majority = data.majorityByVoteParty.get(`${row.vote_id} ${party}`) ?? null
    const eligible = hasPartyLine(party) && majority !== null
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
    ${linkedVotesCte}
    SELECT s.id, s.speaker_name, s.speaker_member_id, s.speaker_role, s.party,
           COALESCE(sdgs.position, s.position) AS position,
           s.text_excerpt, s.date, s.agenda_item,
           COALESCE(sdg.title, pai.title) AS agenda_title,
           sdgs.group_id AS debate_group_id,
           sdgs.contribution_type AS contribution_type,
           v.id AS vote_id,
           v.clean_title AS vote_clean_title
    FROM speeches s
    ${linkedVoteJoin}
    ${debateContextJoins}
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
    yearOfBirth: demoRow?.year_of_birth ?? null,
    sex: parseSex(demoRow?.sex ?? null),
    education: demoRow?.education ?? null,
    sameAs: [
      ...(demoRow?.aw_profile_url ? [demoRow.aw_profile_url] : []),
      ...(demoRow?.wikidata_qid ? [`https://www.wikidata.org/wiki/${demoRow.wikidata_qid}`] : []),
    ],
    mandateType: parseMandate(member.mandate_type),
    listState: member.list_state,
    constituencyNumber: member.constituency_number,
    constituencyName: member.constituency_name,
  }
}
