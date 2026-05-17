import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { db } from '@machtblick/db/client'
import { votes, voteDocuments, votePartySummaries, voteMembers, members, speeches, speechTranslations, voteDescriptionDecisions, voteTranslations, votePartySummaryTranslations } from '@machtblick/db/schema'
import { eq, desc, asc, inArray, and } from 'drizzle-orm'
import { pickAntragFromRows } from './lib/pickAntrag'
import { loadAffiliationsByMember, partyAt } from './memberParty'
import { hasPartyLine } from '../lib/parties'
import { SHOW_HAMMELSPRUNG } from '../lib/voteTypes'
import type { SpeechSummary } from './speeches'
import { normalizeLocale, type Locale } from '../lib/locale'

const SPEECH_PARTY_NORMALIZE: Record<string, string> = {
  'BÜNDNIS 90/DIE GRÜNEN': 'B90/Grüne',
  'DIE LINKE': 'Die Linke',
}

const CURRENT_TERM = 21

function speechTranslationMap(ids: string[], locale: Locale) {
  return new Map(
    locale === 'en' && ids.length
      ? db.select().from(speechTranslations).where(and(eq(speechTranslations.locale, 'en'), inArray(speechTranslations.speechId, ids))).all().map((t) => [t.speechId, t])
      : [],
  )
}

function loadDebateForVote(voteId: string, locale: Locale): SpeechSummary[] {
  const rows = db.select().from(speeches).where(eq(speeches.voteId, voteId)).orderBy(asc(speeches.position)).all()
  const translations = speechTranslationMap(rows.map((row) => row.id), locale)
  return rows.map((row) => ({
    id: row.id,
    speakerName: row.speakerName,
    speakerMemberId: row.speakerMemberId,
    speakerRole: row.speakerRole,
    party: row.party ? (SPEECH_PARTY_NORMALIZE[row.party] ?? row.party) : null,
    position: row.position,
    excerpt: translations.get(row.id)?.textExcerpt ?? row.textExcerpt,
  }))
}

export type VoteListItem = {
  id: string
  date: string
  title: string
  cleanTitle: string | null
  topic: string | null
  voteType: 'namentlich' | 'handzeichen' | 'hammelsprung'
  proposingParty: string | null
  result: 'angenommen' | 'abgelehnt'
  yes: number
  no: number
  abstain: number
  absent: number
  totalMembers: number
  partySummaries: Array<{ party: string; position: 'yes' | 'no' | 'abstain' | 'mixed'; members: number; yes: number; no: number; abstain: number; absent: number }>
}

type LocalizedVoteFields = {
  id: string
  title: string
  cleanTitle: string | null
  topic: string | null
  subject: string | null
  summary: string | null
  summarySimplified: string | null
  summaryDetail: string | null
}

function translationMap(ids: string[], locale: Locale) {
  return new Map(
    locale === 'en' && ids.length
      ? db.select().from(voteTranslations).where(and(eq(voteTranslations.locale, 'en'), inArray(voteTranslations.voteId, ids))).all().map((t) => [t.voteId, t])
      : [],
  )
}

function overlayVote<T extends LocalizedVoteFields>(vote: T, translations: Map<string, typeof voteTranslations.$inferSelect>): T {
  const t = translations.get(vote.id)
  return t ? {
    ...vote,
    title: t.title,
    cleanTitle: t.cleanTitle,
    topic: t.topic,
    subject: t.subject,
    summary: t.summary,
    summarySimplified: t.summarySimplified,
    summaryDetail: t.summaryDetail,
  } : vote
}

function partySummaryTranslationMap(voteId: string, locale: Locale) {
  return new Map(
    locale === 'en'
      ? db.select().from(votePartySummaryTranslations).where(and(eq(votePartySummaryTranslations.locale, 'en'), eq(votePartySummaryTranslations.voteId, voteId))).all().map((t) => [t.party, t])
      : [],
  )
}

export const listVotes = createServerFn({ method: 'GET' })
  .inputValidator(normalizeLocale)
  .handler(async ({ data: locale }): Promise<VoteListItem[]> => {
  const allRows = db.select().from(votes).where(and(eq(votes.termId, CURRENT_TERM), eq(votes.procedural, false))).orderBy(desc(votes.date), desc(votes.bundestagId)).all()
  const rows = SHOW_HAMMELSPRUNG ? allRows : allRows.filter((r) => r.voteType !== 'hammelsprung')
  const translations = translationMap(rows.map((r) => r.id), locale)
  const allSummaries = db.select().from(votePartySummaries).all()
  const byVote = new Map<string, typeof allSummaries>()
  for (const s of allSummaries) {
    const arr = byVote.get(s.voteId) ?? []
    arr.push(s)
    byVote.set(s.voteId, arr)
  }
  const seatsByParty = new Map<string, number>()
  for (const r of rows) {
    if (r.voteType !== 'namentlich') continue
    for (const s of byVote.get(r.id) ?? []) {
      if (s.members && !seatsByParty.has(s.party)) seatsByParty.set(s.party, s.members)
    }
    if (seatsByParty.size >= 6) break
  }
  return rows.map((v) => {
    const localized = overlayVote(v, translations)
    const summaries = byVote.get(v.id) ?? []
    if (v.voteType === 'namentlich' && v.yes != null) {
      return {
        id: v.id, date: v.date, title: localized.title, cleanTitle: localized.cleanTitle, topic: localized.topic, voteType: v.voteType,
        proposingParty: v.initiator, result: v.result,
        yes: v.yes, no: v.no!, abstain: v.abstain!, absent: v.absent!, totalMembers: v.totalMembers!,
        partySummaries: summaries.map((s) => ({
          party: s.party, position: s.position, members: s.members ?? 0,
          yes: s.yes ?? 0, no: s.no ?? 0, abstain: s.abstain ?? 0, absent: s.absent ?? 0,
        })),
      }
    }
    let yes = 0, no = 0, abstain = 0
    const enriched = summaries.map((s) => {
      const seats = seatsByParty.get(s.party) ?? 0
      const bucket = s.position === 'yes' ? 'yes' : s.position === 'no' ? 'no' : s.position === 'abstain' ? 'abstain' : null
      if (bucket === 'yes') yes += seats
      if (bucket === 'no') no += seats
      if (bucket === 'abstain') abstain += seats
      return {
        party: s.party, position: s.position, members: seats,
        yes: bucket === 'yes' ? seats : 0,
        no: bucket === 'no' ? seats : 0,
        abstain: bucket === 'abstain' ? seats : 0,
        absent: 0,
      }
    })
    return {
      id: v.id, date: v.date, title: localized.title, cleanTitle: localized.cleanTitle, topic: localized.topic, voteType: v.voteType,
      proposingParty: v.initiator, result: v.result,
      yes, no, abstain, absent: 0, totalMembers: yes + no + abstain,
      partySummaries: enriched,
    }
  })
})

export type VoteDetail = {
  vote: typeof votes.$inferSelect & { yes: number; no: number; abstain: number; absent: number; totalMembers: number }
  documents: Array<typeof voteDocuments.$inferSelect>
  partySummaries: Array<typeof votePartySummaries.$inferSelect & { yes: number; no: number; abstain: number; absent: number; members: number }>
  proposingParty: string | null
  defectors: Array<{ party: string; majority: string; count: number; members: Array<{ id: string; name: string; choice: string; pictureUrl: string | null }> }>
  memberBallots: Array<{ memberId: string; name: string; party: string; choice: string; pictureUrl: string | null }>
  debate: SpeechSummary[]
  antragPdfUrl: string | null
}

function getSeatsByParty(): Map<string, number> {
  const out = new Map<string, number>()
  const namentlich = db.select().from(votes).where(and(eq(votes.termId, CURRENT_TERM), eq(votes.voteType, 'namentlich'))).orderBy(desc(votes.date)).limit(20).all()
  for (const v of namentlich) {
    const rows = db.select().from(votePartySummaries).where(eq(votePartySummaries.voteId, v.id)).all()
    for (const r of rows) if (r.members && !out.has(r.party)) out.set(r.party, r.members)
    if (out.size >= 6) break
  }
  return out
}

export const getVote = createServerFn({ method: 'GET' })
  .inputValidator((input: string | { id: string; locale?: Locale }) => typeof input === 'string' ? { id: input, locale: 'de' as Locale } : { id: input.id, locale: normalizeLocale(input.locale) })
  .handler(async ({ data }): Promise<VoteDetail> => {
    const { id, locale } = data
    const voteRow = db.select().from(votes).where(eq(votes.id, id)).get()
    if (!voteRow) throw notFound()
    if (!SHOW_HAMMELSPRUNG && voteRow.voteType === 'hammelsprung') throw notFound()
    const translations = translationMap([id], locale)
    const summaryTranslations = partySummaryTranslationMap(id, locale)
    const documents = db.select().from(voteDocuments).where(eq(voteDocuments.voteId, id)).all()
    const summaryRows = db.select().from(votePartySummaries).where(eq(votePartySummaries.voteId, id)).all()
    const seats = getSeatsByParty()
    const partySummaries = summaryRows.map((s) => {
      const t = summaryTranslations.get(s.party)
      if (voteRow.voteType === 'namentlich') {
        return { ...s, positionSummary: t?.positionSummary ?? s.positionSummary, keyPoints: t?.keyPoints ?? s.keyPoints, dissentNote: t?.dissentNote ?? s.dissentNote, members: s.members ?? 0, yes: s.yes ?? 0, no: s.no ?? 0, abstain: s.abstain ?? 0, absent: s.absent ?? 0 }
      }
      const m = seats.get(s.party) ?? 0
      return {
        ...s, positionSummary: t?.positionSummary ?? s.positionSummary, keyPoints: t?.keyPoints ?? s.keyPoints, dissentNote: t?.dissentNote ?? s.dissentNote, members: m,
        yes: s.position === 'yes' ? m : 0,
        no: s.position === 'no' ? m : 0,
        abstain: s.position === 'abstain' ? m : 0,
        absent: 0,
      }
    })
    const localizedVote = overlayVote(voteRow, translations)
    const vote = voteRow.voteType === 'namentlich'
      ? { ...localizedVote, yes: voteRow.yes ?? 0, no: voteRow.no ?? 0, abstain: voteRow.abstain ?? 0, absent: voteRow.absent ?? 0, totalMembers: voteRow.totalMembers ?? 0 }
      : (() => {
          const yes = partySummaries.reduce((a, s) => a + s.yes, 0)
          const no = partySummaries.reduce((a, s) => a + s.no, 0)
          const abstain = partySummaries.reduce((a, s) => a + s.abstain, 0)
          return { ...localizedVote, yes, no, abstain, absent: 0, totalMembers: yes + no + abstain }
        })()
    const rawVmRows = db
      .select({
        memberId: voteMembers.memberId,
        choice: voteMembers.choice,
        name: members.name,
        pictureUrl: members.pictureUrl,
      })
      .from(voteMembers)
      .innerJoin(members, eq(members.id, voteMembers.memberId))
      .where(eq(voteMembers.voteId, id))
      .all()
    const affByMember = loadAffiliationsByMember()
    const vmRows = rawVmRows.map((r) => ({ ...r, party: partyAt(affByMember.get(r.memberId), voteRow.date) }))
    const majorityByParty = new Map<string, string>()
    for (const s of partySummaries) {
      const choices = [
        ['ja', s.yes],
        ['nein', s.no],
        ['enthalten', s.abstain],
        ['nicht_abgegeben', s.absent],
      ] as const
      const top = choices.reduce((a, b) => (b[1] > a[1] ? b : a))
      majorityByParty.set(s.party, top[0])
    }
    const defectorsByParty = new Map<string, Array<{ id: string; name: string; choice: string; pictureUrl: string | null }>>()
    for (const r of vmRows) {
      if (!hasPartyLine(r.party)) continue
      const maj = majorityByParty.get(r.party)
      if (!maj || r.choice === maj || r.choice === 'nicht_abgegeben') continue
      const arr = defectorsByParty.get(r.party) ?? []
      arr.push({ id: r.memberId, name: r.name, choice: r.choice, pictureUrl: r.pictureUrl })
      defectorsByParty.set(r.party, arr)
    }
    const defectors = Array.from(defectorsByParty.entries())
      .map(([party, list]) => ({ party, majority: majorityByParty.get(party)!, count: list.length, members: list }))
      .sort((a, b) => b.count - a.count)
    return {
      vote,
      documents,
      partySummaries,
      proposingParty: vote.initiator,
      defectors,
      memberBallots: vmRows.map((r) => ({ memberId: r.memberId, name: r.name, party: r.party, choice: r.choice, pictureUrl: r.pictureUrl })),
      debate: loadDebateForVote(voteRow.id, locale),
      antragPdfUrl: db.select({ url: voteDescriptionDecisions.sourcePdfUrl }).from(voteDescriptionDecisions).where(eq(voteDescriptionDecisions.voteId, id)).get()?.url
        ?? pickAntragFromRows(documents.map((d) => ({ label: d.label, title: d.title, url: d.url })))?.pdfUrl
        ?? null,
    }
  })
