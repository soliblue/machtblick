import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { db } from '@machtblick/db/client'
import {
  antraege,
  antragSignatories,
  memberAbgeordnetenwatch,
  members,
  speechTranslations as speechTranslationRows,
  voteAntraege,
  voteMembers,
  votePartySummaries,
  votes,
  voteTranslations,
} from '@machtblick/db/schema'
import { eq, desc, and, sql, inArray } from 'drizzle-orm'
import { getCurrentPartyMap, loadAffiliationsByMember, partyAt } from './memberParty'
import { hasPartyLine } from '../lib/parties'
import type { SpeechResult } from './speeches'
import { normalizeLocale, type Locale } from '../lib/locale'

export type MemberSex = 'm' | 'f' | 'd'
export type MandateType = 'direkt' | 'liste'

function loadDemographics(): Map<string, { yearOfBirth: number | null; sex: MemberSex | null }> {
  const rows = db
    .select({
      memberId: memberAbgeordnetenwatch.memberId,
      yearOfBirth: sql<number | null>`json_extract(${memberAbgeordnetenwatch.rawJson}, '$.year_of_birth')`,
      sex: sql<string | null>`json_extract(${memberAbgeordnetenwatch.rawJson}, '$.sex')`,
    })
    .from(memberAbgeordnetenwatch)
    .all()
  const out = new Map<string, { yearOfBirth: number | null; sex: MemberSex | null }>()
  for (const r of rows) {
    const sex = r.sex === 'm' || r.sex === 'f' || r.sex === 'd' ? r.sex : null
    out.set(r.memberId, { yearOfBirth: r.yearOfBirth ?? null, sex })
  }
  return out
}

const CURRENT_TERM = 21

export type MemberListItem = {
  id: string
  name: string
  party: string
  state: string
  votesAppeared: number
  attendance: number
  loyalty: number | null
  yearOfBirth: number | null
  sex: MemberSex | null
  mandateType: MandateType | null
}

function majorityChoice(s: typeof votePartySummaries.$inferSelect): string {
  const c = [
    ['ja', s.yes ?? 0],
    ['nein', s.no ?? 0],
    ['enthalten', s.abstain ?? 0],
    ['nicht_abgegeben', s.absent ?? 0],
  ] as const
  return c.reduce((a, b) => (b[1] > a[1] ? b : a), c[0])[0]
}

export const listMembers = createServerFn({ method: 'GET' }).handler(async (): Promise<MemberListItem[]> => {
  const allMembers = db.select().from(members).all()
  const nonProceduralVotes = db.select({ id: votes.id, date: votes.date }).from(votes).where(and(eq(votes.termId, CURRENT_TERM), eq(votes.procedural, false))).all()
  const dateByVote = new Map(nonProceduralVotes.map((v) => [v.id, v.date]))
  const vmRows = db.select().from(voteMembers).all().filter((r) => dateByVote.has(r.voteId))
  const summaries = db.select().from(votePartySummaries).all().filter((s) => dateByVote.has(s.voteId))
  const majByVoteParty = new Map<string, string>()
  for (const s of summaries) majByVoteParty.set(`${s.voteId} ${s.party}`, majorityChoice(s))
  const affByMember = loadAffiliationsByMember()
  const currentPartyByMember = getCurrentPartyMap()
  const demographics = loadDemographics()
  const mandateByMember = new Map(allMembers.map((m) => [m.id, m.mandateType]))
  const stats = new Map<string, { name: string; party: string; state: string; total: number; absent: number; loyalMatches: number; loyalEligible: number }>()
  for (const m of allMembers) stats.set(m.id, { name: m.name, party: currentPartyByMember.get(m.id) ?? '', state: '', total: 0, absent: 0, loyalMatches: 0, loyalEligible: 0 })
  for (const r of vmRows) {
    const s = stats.get(r.memberId)
    if (!s) continue
    s.state = r.state
    s.total++
    if (r.choice === 'nicht_abgegeben') s.absent++
    else {
      const partyAtVote = partyAt(affByMember.get(r.memberId), dateByVote.get(r.voteId)!)
      if (hasPartyLine(partyAtVote)) {
        s.loyalEligible++
        const maj = majByVoteParty.get(`${r.voteId} ${partyAtVote}`)
        if (maj && maj === r.choice) s.loyalMatches++
      }
    }
  }
  const out: MemberListItem[] = []
  for (const [id, s] of stats) {
    if (!s.total) continue
    const demo = demographics.get(id)
    out.push({
      id,
      name: s.name,
      party: s.party,
      state: s.state,
      votesAppeared: s.total,
      attendance: 1 - s.absent / s.total,
      loyalty: s.loyalEligible > 0 ? s.loyalMatches / s.loyalEligible : null,
      yearOfBirth: demo?.yearOfBirth ?? null,
      sex: demo?.sex ?? null,
      mandateType: mandateByMember.get(id) === 'direkt' || mandateByMember.get(id) === 'liste' ? (mandateByMember.get(id) as MandateType) : null,
    })
  }
  out.sort((a, b) => a.name.localeCompare(b.name, 'de'))
  return out
})

export type MemberVoteRow = {
  voteId: string
  date: string
  title: string
  cleanTitle: string | null
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
  initiatives: MemberInitiativeRow[]
  mandateType: MandateType | null
  listState: string | null
  constituencyNumber: string | null
  constituencyName: string | null
}

export type MemberInitiativeVote = {
  voteId: string
  date: string
  title: string
  cleanTitle: string | null
  result: 'angenommen' | 'abgelehnt'
}

export type MemberInitiativeRow = {
  antragId: number
  title: string
  cleanTitle: string | null
  beratungsstand: string | null
  introducedDate: string | null
  drucksachePdfUrl: string | null
  sachgebiet: string[]
  signatoryCount: number
  linkedVotes: MemberInitiativeVote[]
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

function translationMap(ids: string[], locale: Locale) {
  return new Map(
    locale === 'en' && ids.length
      ? db.select().from(voteTranslations).where(and(eq(voteTranslations.locale, 'en'), inArray(voteTranslations.voteId, ids))).all().map((t) => [t.voteId, t])
      : [],
  )
}

function speechTextTranslationMap(ids: string[], locale: Locale) {
  return new Map(
    locale === 'en' && ids.length
      ? db.select().from(speechTranslationRows).where(and(eq(speechTranslationRows.locale, 'en'), inArray(speechTranslationRows.speechId, ids))).all().map((t) => [t.speechId, t])
      : [],
  )
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
    const historyTranslations = translationMap(vmRows.map((r) => r.voteId), locale)
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
        title: t?.title ?? r.title,
        cleanTitle: t?.cleanTitle ?? r.cleanTitle,
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
             lv.vote_id AS vote_id,
             v.title AS vote_title,
             v.clean_title AS vote_clean_title
      FROM speeches s
      LEFT JOIN linked_votes lv ON lv.speech_id = s.id AND lv.rn = 1
      LEFT JOIN votes v ON v.id = lv.vote_id
      LEFT JOIN speech_debate_group_speeches sdgs ON sdgs.speech_id = s.id
      LEFT JOIN speech_debate_groups sdg ON sdg.id = sdgs.group_id
      LEFT JOIN plenary_agenda_items pai ON pai.session_id = s.session_id AND pai.date = s.date AND pai.agenda_item = s.agenda_item
      WHERE s.speaker_member_id = ${id}
      ORDER BY s.date DESC, COALESCE(sdgs.position, s.position) ASC
    `) as MemberSpeechJoinRow[]
    const speechVoteTranslations = translationMap(memberSpeeches.map((row) => row.vote_id).filter((id): id is string => !!id), locale)
    const speechTextTranslations = speechTextTranslationMap(memberSpeeches.map((row) => row.id), locale)
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
        voteTitle: t?.cleanTitle ?? t?.title ?? row.vote_clean_title ?? row.vote_title,
        snippet: null,
      }
    })
    const signedInitiatives = db
      .select({ antragId: antragSignatories.antragId })
      .from(antragSignatories)
      .where(eq(antragSignatories.memberId, id))
      .all()
    const antragIds = signedInitiatives.map((s) => s.antragId)
    const initiativeRows = antragIds.length
      ? db
          .select({
            id: antraege.id,
            title: antraege.title,
            cleanTitle: antraege.cleanTitle,
            beratungsstand: antraege.beratungsstand,
            introducedDate: antraege.introducedDate,
            drucksachePdfUrl: antraege.drucksachePdfUrl,
            sachgebiet: antraege.sachgebiet,
          })
          .from(antraege)
          .where(inArray(antraege.id, antragIds))
          .orderBy(desc(antraege.introducedDate))
          .all()
      : []
    const initiativeCounts = antragIds.length
      ? db
          .select({ antragId: antragSignatories.antragId, n: sql<number>`count(*)`.as('n') })
          .from(antragSignatories)
          .where(inArray(antragSignatories.antragId, antragIds))
          .groupBy(antragSignatories.antragId)
          .all()
      : []
    const initiativeVoteRows = antragIds.length
      ? db
          .select({
            antragId: voteAntraege.antragId,
            voteId: votes.id,
            date: votes.date,
            title: votes.title,
            cleanTitle: votes.cleanTitle,
            result: votes.result,
          })
          .from(voteAntraege)
          .innerJoin(votes, eq(votes.id, voteAntraege.voteId))
          .where(inArray(voteAntraege.antragId, antragIds))
          .orderBy(desc(votes.date))
          .all()
      : []
    const initiativeCountById = new Map(initiativeCounts.map((r) => [r.antragId, r.n]))
    const initiativeVotesById = new Map<number, MemberInitiativeVote[]>()
    for (const r of initiativeVoteRows) {
      const list = initiativeVotesById.get(r.antragId) ?? []
      list.push({
        voteId: r.voteId,
        date: r.date,
        title: r.title,
        cleanTitle: r.cleanTitle,
        result: r.result,
      })
      initiativeVotesById.set(r.antragId, list)
    }
    const initiatives: MemberInitiativeRow[] = initiativeRows.map((r) => ({
      antragId: r.id,
      title: r.title,
      cleanTitle: r.cleanTitle,
      beratungsstand: r.beratungsstand,
      introducedDate: r.introducedDate,
      drucksachePdfUrl: r.drucksachePdfUrl,
      sachgebiet: r.sachgebiet ?? [],
      signatoryCount: initiativeCountById.get(r.id) ?? 1,
      linkedVotes: initiativeVotesById.get(r.id) ?? [],
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
      speeches: speechResults,
      pictureUrl: m.pictureUrl,
      pictureAuthor: m.pictureAuthor,
      pictureLicense: m.pictureLicense,
      pictureSourceUrl: m.pictureSourceUrl,
      yearOfBirth,
      sex,
      education,
      initiatives,
      mandateType: m.mandateType === 'direkt' || m.mandateType === 'liste' ? m.mandateType : null,
      listState: m.listState,
      constituencyNumber: m.constituencyNumber,
      constituencyName: m.constituencyName,
    }
  })
