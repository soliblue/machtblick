import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { db } from '@machtblick/db/client'
import { memberAbgeordnetenwatch, members, voteMembers, votePartySummaries, votes } from '@machtblick/db/schema'
import { eq, desc, and, sql } from 'drizzle-orm'
import { loadAffiliationsByMember, partyAt } from './memberParty'
import { majorityChoice } from './majorityChoice'
import { CURRENT_TERM } from './term'
import { speechTranslationMap, voteTranslationMap } from './translations'
import { loadMemberInitiatives, type MemberInitiativeRow } from './memberInitiatives'
import type { MandateType, MemberSex } from './members'
import { hasPartyLine } from '../lib/parties'
import type { SpeechResult } from './speeches'
import { normalizeLocale, type Locale } from '../lib/locale'
import { requireVoteCleanTitle, requireVoteTitleText } from '../lib/voteTitles'

export type MemberVoteRow = {
  voteId: string
  date: string
  title: string
  cleanTitle: string
  result: 'angenommen' | 'abgelehnt'
  choice: 'ja' | 'nein' | 'enthalten' | 'nicht_abgegeben'
  party: string
  partyMajority: string
  defected: boolean | null
}

export type MemberDetail = {
  id: string
  name: string
  party: string
  state: string
  attendance: number
  loyalty: number | null
  votesAppeared: number
  defections: number
  history: MemberVoteRow[]
  speeches: SpeechResult[]
  pictureUrl: string | null
  pictureAuthor: string | null
  pictureLicense: string | null
  pictureSourceUrl: string | null
  yearOfBirth: number | null
  sex: MemberSex | null
  education: string | null
  sameAs: string[]
  initiatives: MemberInitiativeRow[]
  mandateType: MandateType | null
  listState: string | null
  constituencyNumber: string | null
  constituencyName: string | null
}

type MemberSpeechJoinRow = {
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

export const getMember = createServerFn({ method: 'GET' })
  .inputValidator((input: string | { id: string; locale?: Locale }) => typeof input === 'string' ? { id: input, locale: 'de' as Locale } : { id: input.id, locale: normalizeLocale(input.locale) })
  .handler(async ({ data }): Promise<MemberDetail> => {
    const { id, locale } = data
    const m = db.select().from(members).where(eq(members.id, id)).get()
    if (!m) throw notFound()
    const demoRow = db
      .select({
        yearOfBirth: sql<number | null>`json_extract(${memberAbgeordnetenwatch.rawJson}, '$.year_of_birth')`,
        sex: sql<string | null>`json_extract(${memberAbgeordnetenwatch.rawJson}, '$.sex')`,
        education: sql<string | null>`json_extract(${memberAbgeordnetenwatch.rawJson}, '$.education')`,
        awProfileUrl: sql<string | null>`json_extract(${memberAbgeordnetenwatch.rawJson}, '$.abgeordnetenwatch_url')`,
        wikidataQid: sql<string | null>`json_extract(${memberAbgeordnetenwatch.rawJson}, '$.qid_wikidata')`,
      })
      .from(memberAbgeordnetenwatch)
      .where(eq(memberAbgeordnetenwatch.memberId, id))
      .get()
    const sex = demoRow?.sex === 'm' || demoRow?.sex === 'f' || demoRow?.sex === 'd' ? (demoRow.sex as MemberSex) : null
    const yearOfBirth = demoRow?.yearOfBirth ?? null
    const education = demoRow?.education ?? null
    const vmRows = db
      .select({
        voteId: voteMembers.voteId,
        state: voteMembers.state,
        choice: voteMembers.choice,
        date: votes.date,
        title: votes.title,
        cleanTitle: votes.cleanTitle,
        result: votes.result,
      })
      .from(voteMembers)
      .innerJoin(votes, eq(votes.id, voteMembers.voteId))
      .where(and(eq(voteMembers.memberId, id), eq(votes.termId, CURRENT_TERM), eq(votes.procedural, false)))
      .orderBy(desc(votes.date))
      .all()
    const historyTranslations = voteTranslationMap(vmRows.map((r) => r.voteId), locale)
    const affList = loadAffiliationsByMember().get(id) ?? []
    const summaries = db.select().from(votePartySummaries).all()
    const majByVoteParty = new Map<string, string>()
    for (const s of summaries) majByVoteParty.set(`${s.voteId} ${s.party}`, majorityChoice(s))
    let absent = 0
    let loyalMatches = 0
    let loyalEligible = 0
    let defections = 0
    const history: MemberVoteRow[] = vmRows.map((r) => {
      const t = historyTranslations.get(r.voteId)
      const titled = requireVoteCleanTitle({ id: r.voteId, title: r.title, cleanTitle: t?.cleanTitle ?? r.cleanTitle })
      const party = partyAt(affList, r.date)
      const maj = majByVoteParty.get(`${r.voteId} ${party}`) ?? ''
      const eligible = hasPartyLine(party)
      const defected = r.choice === 'nicht_abgegeben' ? false : eligible ? r.choice !== maj : null
      if (r.choice === 'nicht_abgegeben') absent++
      else if (eligible) {
        loyalEligible++
        if (r.choice === maj) loyalMatches++
        else defections++
      }
      return {
        voteId: r.voteId,
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
    const currentParty = affList.find((a) => a.validTo === null)?.party ?? ''
    const memberSpeeches = db.all(sql`
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
      WHERE s.speaker_member_id = ${id}
      ORDER BY s.date DESC, COALESCE(sdgs.position, s.position) ASC
    `) as MemberSpeechJoinRow[]
    const speechVoteTranslations = voteTranslationMap(memberSpeeches.map((row) => row.vote_id).filter((id): id is string => !!id), locale)
    const speechTextTranslations = speechTranslationMap(memberSpeeches.map((row) => row.id), locale)
    const speechResults: SpeechResult[] = memberSpeeches.map((row) => {
      const t = row.vote_id ? speechVoteTranslations.get(row.vote_id) : null
      const st = speechTextTranslations.get(row.id)
      return {
        id: row.id,
        speakerName: row.speaker_name,
        speakerMemberId: row.speaker_member_id,
        speakerRole: row.speaker_role,
        party: row.party,
        position: row.position,
        excerpt: st?.textExcerpt ?? row.text_excerpt,
        date: row.date,
        agendaItem: row.agenda_item,
        agendaTitle: row.agenda_title,
        debateGroupId: row.debate_group_id,
        contributionType: row.contribution_type,
        voteId: row.vote_id,
        voteTitle: requireVoteTitleText(row.vote_id, t?.cleanTitle ?? row.vote_clean_title),
        snippet: null,
      }
    })
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
      speeches: speechResults,
      pictureUrl: m.pictureUrl,
      pictureAuthor: m.pictureAuthor,
      pictureLicense: m.pictureLicense,
      pictureSourceUrl: m.pictureSourceUrl,
      yearOfBirth,
      sex,
      education,
      sameAs: [
        ...(demoRow?.awProfileUrl ? [demoRow.awProfileUrl] : []),
        ...(demoRow?.wikidataQid ? [`https://www.wikidata.org/wiki/${demoRow.wikidataQid}`] : []),
      ],
      initiatives: loadMemberInitiatives(id, locale),
      mandateType: m.mandateType === 'direkt' || m.mandateType === 'liste' ? m.mandateType : null,
      listState: m.listState,
      constituencyNumber: m.constituencyNumber,
      constituencyName: m.constituencyName,
    }
  })
