import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { db } from '@machtblick/db/client'
import {
  antraege,
  antragDescriptions,
  antragDescriptionTranslations,
  antragSignatories,
  members,
  speeches,
  speechTranslations,
  voteAntraege,
  voteMembers,
  votePartySummaries,
  votePartySummaryTranslations,
  voteTranslations,
  votes,
} from '@machtblick/db/schema'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { normalizeLocale, type Locale } from '@/lib/locale'
import { normalizePartyName } from '@/lib/parties'
import { SHOW_HAMMELSPRUNG } from '@/lib/voteTypes'
import { loadAffiliationsByMember, partyAt } from './memberParty'
import type { SpeechSummary } from './speeches'

const CURRENT_TERM = 21

const SPEECH_PARTY_NORMALIZE: Record<string, string> = {
  'BÜNDNIS 90/DIE GRÜNEN': 'B90/Grüne',
  'DIE LINKE': 'Die Linke',
}

export type AntragSignatory = {
  memberId: string
  displayName: string
  partyAtDate: string | null
  portraitUrl: string | null
}

export type AntragLinkedVote = {
  id: string
  date: string
  title: string
  cleanTitle: string | null
  result: 'angenommen' | 'abgelehnt'
  voteType: 'namentlich' | 'handzeichen' | 'hammelsprung'
  yes: number
  no: number
  abstain: number
  absent: number
  totalMembers: number
  partySummaries: Array<{
    voteId: string
    party: string
    position: 'yes' | 'no' | 'abstain' | 'mixed'
    members: number
    yes: number
    no: number
    abstain: number
    absent: number
    positionSummary: string | null
    keyPoints: string | null
    dissentNote: string | null
  }>
  memberBallots: Array<{ memberId: string; name: string; party: string; choice: string; pictureUrl: string | null }>
}

export type AntragDetail = {
  antrag: {
    id: number
    type: 'antrag' | 'gesetzentwurf'
    title: string
    cleanTitle: string | null
    abstract: string | null
    beratungsstand: string | null
    initiativeFraktion: string | null
    introducedDate: string | null
    drucksache: string | null
    drucksachePdfUrl: string | null
    sachgebiet: string[]
    deskriptor: { name: string; typ: string }[]
    summarySimplified: string | null
    summaryDetail: string | null
  }
  signatories: AntragSignatory[]
  linkedVotes: AntragLinkedVote[]
  debate: SpeechSummary[]
}

function voteTranslationMap(ids: string[], locale: Locale) {
  return new Map(
    locale === 'en' && ids.length
      ? db.select().from(voteTranslations).where(and(eq(voteTranslations.locale, 'en'), inArray(voteTranslations.voteId, ids))).all().map((t) => [t.voteId, t])
      : [],
  )
}

function partySummaryTranslationMap(ids: string[], locale: Locale) {
  return new Map(
    locale === 'en' && ids.length
      ? db.select().from(votePartySummaryTranslations).where(and(eq(votePartySummaryTranslations.locale, 'en'), inArray(votePartySummaryTranslations.voteId, ids))).all().map((t) => [`${t.voteId}\u0000${t.party}`, t])
      : [],
  )
}

function speechTranslationMap(ids: string[], locale: Locale) {
  return new Map(
    locale === 'en' && ids.length
      ? db.select().from(speechTranslations).where(and(eq(speechTranslations.locale, 'en'), inArray(speechTranslations.speechId, ids))).all().map((t) => [t.speechId, t])
      : [],
  )
}

function cleanAbstract(value: string | null) {
  return value
    ?.replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim() || null
}

function getSeatsByParty(): Map<string, number> {
  const out = new Map<string, number>()
  const rows = db.select().from(votes).where(and(eq(votes.termId, CURRENT_TERM), eq(votes.voteType, 'namentlich'))).orderBy(desc(votes.date)).limit(20).all()
  for (const v of rows) {
    const summaries = db.select().from(votePartySummaries).where(eq(votePartySummaries.voteId, v.id)).all()
    for (const r of summaries) if (r.members && !out.has(r.party)) out.set(r.party, r.members)
    if (out.size >= 6) break
  }
  return out
}

export const getAntrag = createServerFn({ method: 'GET' })
  .inputValidator((input: string | { id: string | number; locale?: Locale }) => typeof input === 'string' || typeof input === 'number' ? { id: Number(input), locale: 'de' as Locale } : { id: Number(input.id), locale: normalizeLocale(input.locale) })
  .handler(async ({ data }): Promise<AntragDetail> => {
    const { id, locale } = data
    if (!Number.isInteger(id)) throw notFound()
    const row = db.select().from(antraege).where(eq(antraege.id, id)).get()
    if (!row || row.wahlperiode !== CURRENT_TERM) throw notFound()
    const description = db.select().from(antragDescriptions).where(eq(antragDescriptions.antragId, id)).get()
    const translation = locale === 'en'
      ? db.select().from(antragDescriptionTranslations).where(and(eq(antragDescriptionTranslations.antragId, id), eq(antragDescriptionTranslations.locale, 'en'))).get()
      : null
    const links = db.select({ voteId: voteAntraege.voteId }).from(voteAntraege).where(eq(voteAntraege.antragId, id)).all()
    const voteIds = links.map((l) => l.voteId)
    const voteRows = voteIds.length
      ? db.select().from(votes).where(inArray(votes.id, voteIds)).orderBy(desc(votes.date)).all().filter((v) => SHOW_HAMMELSPRUNG || v.voteType !== 'hammelsprung')
      : []
    const translations = voteTranslationMap(voteRows.map((v) => v.id), locale)
    const summaryTranslations = partySummaryTranslationMap(voteRows.map((v) => v.id), locale)
    const summaryRows = voteRows.length
      ? db.select().from(votePartySummaries).where(inArray(votePartySummaries.voteId, voteRows.map((v) => v.id))).all()
      : []
    const seats = getSeatsByParty()
    const summariesByVote = new Map<string, AntragLinkedVote['partySummaries']>()
    for (const s of summaryRows) {
      const arr = summariesByVote.get(s.voteId) ?? []
      const t = summaryTranslations.get(`${s.voteId}\u0000${s.party}`)
      const vote = voteRows.find((v) => v.id === s.voteId)
      if (vote?.voteType === 'namentlich') {
        arr.push({ ...s, positionSummary: t?.positionSummary ?? s.positionSummary, keyPoints: t?.keyPoints ?? s.keyPoints, dissentNote: t?.dissentNote ?? s.dissentNote, members: s.members ?? 0, yes: s.yes ?? 0, no: s.no ?? 0, abstain: s.abstain ?? 0, absent: s.absent ?? 0 })
      } else {
        const members = seats.get(s.party) ?? 0
        arr.push({
          ...s,
          positionSummary: t?.positionSummary ?? s.positionSummary,
          keyPoints: t?.keyPoints ?? s.keyPoints,
          dissentNote: t?.dissentNote ?? s.dissentNote,
          members,
          yes: s.position === 'yes' ? members : 0,
          no: s.position === 'no' ? members : 0,
          abstain: s.position === 'abstain' ? members : 0,
          absent: 0,
        })
      }
      summariesByVote.set(s.voteId, arr)
    }
    const rawBallots = voteRows.length
      ? db
          .select({ voteId: voteMembers.voteId, memberId: voteMembers.memberId, choice: voteMembers.choice, name: members.name, pictureUrl: members.pictureUrl })
          .from(voteMembers)
          .innerJoin(members, eq(members.id, voteMembers.memberId))
          .where(inArray(voteMembers.voteId, voteRows.map((v) => v.id)))
          .all()
      : []
    const affByMember = loadAffiliationsByMember()
    const ballotsByVote = new Map<string, AntragLinkedVote['memberBallots']>()
    for (const b of rawBallots) {
      const vote = voteRows.find((v) => v.id === b.voteId)
      const arr = ballotsByVote.get(b.voteId) ?? []
      arr.push({ memberId: b.memberId, name: b.name, choice: b.choice, pictureUrl: b.pictureUrl, party: vote ? partyAt(affByMember.get(b.memberId), vote.date) : '' })
      ballotsByVote.set(b.voteId, arr)
    }
    const linkedVotes: AntragLinkedVote[] = voteRows.map((v) => {
      const t = translations.get(v.id)
      const summaries = summariesByVote.get(v.id) ?? []
      if (v.voteType === 'namentlich') {
        return {
          id: v.id,
          date: v.date,
          title: t?.title ?? v.title,
          cleanTitle: t?.cleanTitle ?? v.cleanTitle,
          result: v.result,
          voteType: v.voteType,
          yes: v.yes ?? 0,
          no: v.no ?? 0,
          abstain: v.abstain ?? 0,
          absent: v.absent ?? 0,
          totalMembers: v.totalMembers ?? 0,
          partySummaries: summaries,
          memberBallots: ballotsByVote.get(v.id) ?? [],
        }
      }
      const yes = summaries.reduce((a, s) => a + s.yes, 0)
      const no = summaries.reduce((a, s) => a + s.no, 0)
      const abstain = summaries.reduce((a, s) => a + s.abstain, 0)
      return {
        id: v.id,
        date: v.date,
        title: t?.title ?? v.title,
        cleanTitle: t?.cleanTitle ?? v.cleanTitle,
        result: v.result,
        voteType: v.voteType,
        yes,
        no,
        abstain,
        absent: 0,
        totalMembers: yes + no + abstain,
        partySummaries: summaries,
        memberBallots: ballotsByVote.get(v.id) ?? [],
      }
    })
    const speechRows = voteRows.length
      ? db.select().from(speeches).where(inArray(speeches.voteId, voteRows.map((v) => v.id))).orderBy(desc(speeches.date), asc(speeches.position)).all()
      : []
    const speechTranslationsById = speechTranslationMap(speechRows.map((s) => s.id), locale)
    const debate: SpeechSummary[] = speechRows.map((s) => ({
      id: s.id,
      speakerName: s.speakerName,
      speakerMemberId: s.speakerMemberId,
      speakerRole: s.speakerRole,
      party: s.party ? (SPEECH_PARTY_NORMALIZE[s.party] ?? s.party) : null,
      position: s.position,
      excerpt: speechTranslationsById.get(s.id)?.textExcerpt ?? s.textExcerpt,
    }))
    const signatoryRows = db
      .select({ memberId: antragSignatories.memberId, firstName: members.firstName, lastName: members.lastName, pictureUrl: members.pictureUrl })
      .from(antragSignatories)
      .innerJoin(members, eq(members.id, antragSignatories.memberId))
      .where(eq(antragSignatories.antragId, id))
      .all()
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'de') || a.firstName.localeCompare(b.firstName, 'de'))
    const signatories: AntragSignatory[] = signatoryRows.map((s) => ({
      memberId: s.memberId,
      displayName: `${s.firstName} ${s.lastName}`,
      partyAtDate: partyAt(affByMember.get(s.memberId), row.introducedDate ?? new Date().toISOString().slice(0, 10)) || null,
      portraitUrl: s.pictureUrl,
    }))
    return {
      antrag: {
        id: row.id,
        type: row.type,
        title: row.title,
        cleanTitle: row.cleanTitle,
        abstract: cleanAbstract(row.abstract),
        beratungsstand: row.beratungsstand,
        initiativeFraktion: normalizePartyName(row.initiativeFraktion),
        introducedDate: row.introducedDate,
        drucksache: row.drucksache,
        drucksachePdfUrl: row.drucksachePdfUrl,
        sachgebiet: row.sachgebiet ?? [],
        deskriptor: row.deskriptor ?? [],
        summarySimplified: translation?.summarySimplified ?? description?.summarySimplified ?? null,
        summaryDetail: translation?.summaryDetail ?? description?.summaryDetail ?? null,
      },
      signatories,
      linkedVotes,
      debate,
    }
  })
