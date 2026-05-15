import { createServerFn } from '@tanstack/react-start'
import { db } from '@machtblick/db/client'
import { members, memberAbgeordnetenwatch, voteMembers, votes, votePartySummaries, speeches, voteTranslations } from '@machtblick/db/schema'
import { eq, desc, and, asc, sql, inArray } from 'drizzle-orm'
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

const SPEECH_PARTY_NORMALIZE: Record<string, string> = {
  'BÜNDNIS 90/DIE GRÜNEN': 'B90/Grüne',
  'DIE LINKE': 'Die Linke',
}

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
  const nonProceduralVotes = db.select({ id: votes.id, date: votes.date }).from(votes).where(eq(votes.procedural, false)).all()
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
  mandateType: MandateType | null
  listState: string | null
  constituencyNumber: string | null
  constituencyName: string | null
}

function translationMap(ids: string[], locale: Locale) {
  return new Map(
    locale === 'en' && ids.length
      ? db.select().from(voteTranslations).where(and(eq(voteTranslations.locale, 'en'), inArray(voteTranslations.voteId, ids))).all().map((t) => [t.voteId, t])
      : [],
  )
}

export const getMember = createServerFn({ method: 'GET' })
  .inputValidator((input: string | { id: string; locale?: Locale }) => typeof input === 'string' ? { id: input, locale: 'de' as Locale } : { id: input.id, locale: normalizeLocale(input.locale) })
  .handler(async ({ data }): Promise<MemberDetail> => {
    const { id, locale } = data
    const m = db.select().from(members).where(eq(members.id, id)).get()
    if (!m) throw new Error(`member not found: ${id}`)
    const demoRow = db
      .select({
        yearOfBirth: sql<number | null>`json_extract(${memberAbgeordnetenwatch.rawJson}, '$.year_of_birth')`,
        sex: sql<string | null>`json_extract(${memberAbgeordnetenwatch.rawJson}, '$.sex')`,
      })
      .from(memberAbgeordnetenwatch)
      .where(eq(memberAbgeordnetenwatch.memberId, id))
      .get()
    const sex = demoRow?.sex === 'm' || demoRow?.sex === 'f' || demoRow?.sex === 'd' ? (demoRow.sex as MemberSex) : null
    const yearOfBirth = demoRow?.yearOfBirth ?? null
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
      .where(and(eq(voteMembers.memberId, id), eq(votes.procedural, false)))
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
    const memberSpeeches = db
      .select({ speech: speeches, voteTitle: votes.title, voteCleanTitle: votes.cleanTitle })
      .from(speeches)
      .leftJoin(votes, eq(votes.id, speeches.voteId))
      .where(eq(speeches.speakerMemberId, id))
      .orderBy(desc(speeches.date), asc(speeches.position))
      .all()
    const speechTranslations = translationMap(memberSpeeches.map(({ speech }) => speech.voteId).filter((id): id is string => !!id), locale)
    const speechResults: SpeechResult[] = memberSpeeches.map(({ speech: row, voteTitle, voteCleanTitle }) => {
      const t = row.voteId ? speechTranslations.get(row.voteId) : null
      return {
        id: row.id,
        speakerName: row.speakerName,
        speakerMemberId: row.speakerMemberId,
        speakerRole: row.speakerRole,
        party: row.party ? (SPEECH_PARTY_NORMALIZE[row.party] ?? row.party) : null,
        position: row.position,
        excerpt: row.textExcerpt,
        date: row.date,
        voteId: row.voteId,
        voteTitle: t?.cleanTitle ?? t?.title ?? voteCleanTitle ?? voteTitle,
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
      mandateType: m.mandateType === 'direkt' || m.mandateType === 'liste' ? m.mandateType : null,
      listState: m.listState,
      constituencyNumber: m.constituencyNumber,
      constituencyName: m.constituencyName,
    }
  })
