import { db } from '@machtblick/db/client'
import {
  antraege,
  antragDescriptions,
  antragDescriptionTranslations,
  antragSignatories,
  voteAntraege,
  votes,
} from '@machtblick/db/schema'
import { eq, desc, and, sql, inArray } from 'drizzle-orm'
import { voteTranslationMap } from './translations'
import type { Locale } from '../lib/locale'
import { requireVoteCleanTitle } from '../lib/voteTitles'

export type MemberInitiativeVote = {
  voteId: string
  date: string
  title: string
  cleanTitle: string
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

export function loadMemberInitiatives(memberId: string, locale: Locale): MemberInitiativeRow[] {
  const signedInitiatives = db
    .select({ antragId: antragSignatories.antragId })
    .from(antragSignatories)
    .where(eq(antragSignatories.memberId, memberId))
    .all()
  const antragIds = signedInitiatives.map((s) => s.antragId)
  const publishedAntragIds = antragIds.length
    ? locale === 'en'
      ? db
          .select({ id: antraege.id })
          .from(antraege)
          .innerJoin(antragDescriptions, eq(antragDescriptions.antragId, antraege.id))
          .innerJoin(antragDescriptionTranslations, and(eq(antragDescriptionTranslations.antragId, antraege.id), eq(antragDescriptionTranslations.locale, 'en')))
          .where(inArray(antraege.id, antragIds))
          .all()
          .map((r) => r.id)
      : db
          .select({ id: antraege.id })
          .from(antraege)
          .innerJoin(antragDescriptions, eq(antragDescriptions.antragId, antraege.id))
          .where(inArray(antraege.id, antragIds))
          .all()
          .map((r) => r.id)
    : []
  const initiativeRows = publishedAntragIds.length
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
        .where(inArray(antraege.id, publishedAntragIds))
        .orderBy(desc(antraege.introducedDate))
        .all()
    : []
  const initiativeCounts = publishedAntragIds.length
    ? db
        .select({ antragId: antragSignatories.antragId, n: sql<number>`count(*)`.as('n') })
        .from(antragSignatories)
        .where(inArray(antragSignatories.antragId, publishedAntragIds))
        .groupBy(antragSignatories.antragId)
        .all()
    : []
  const initiativeVoteRows = publishedAntragIds.length
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
        .where(inArray(voteAntraege.antragId, publishedAntragIds))
        .orderBy(desc(votes.date))
        .all()
    : []
  const antragTitleTranslations = new Map(
    locale === 'en' && publishedAntragIds.length
      ? db
          .select({ antragId: antragDescriptionTranslations.antragId, title: antragDescriptionTranslations.title, cleanTitle: antragDescriptionTranslations.cleanTitle })
          .from(antragDescriptionTranslations)
          .where(and(eq(antragDescriptionTranslations.locale, 'en'), inArray(antragDescriptionTranslations.antragId, publishedAntragIds)))
          .all()
          .map((t) => [t.antragId, t])
      : [],
  )
  const initiativeCountById = new Map(initiativeCounts.map((r) => [r.antragId, r.n]))
  const initiativeVoteTranslations = voteTranslationMap(initiativeVoteRows.map((r) => r.voteId), locale)
  const initiativeVotesById = new Map<number, MemberInitiativeVote[]>()
  for (const r of initiativeVoteRows) {
    const list = initiativeVotesById.get(r.antragId) ?? []
    const t = initiativeVoteTranslations.get(r.voteId)
    const titled = requireVoteCleanTitle({ id: r.voteId, title: t?.title ?? r.title, cleanTitle: t?.cleanTitle ?? r.cleanTitle })
    list.push({
      voteId: r.voteId,
      date: r.date,
      title: titled.title,
      cleanTitle: titled.cleanTitle,
      result: r.result,
    })
    initiativeVotesById.set(r.antragId, list)
  }
  return initiativeRows.map((r) => ({
    antragId: r.id,
    title: antragTitleTranslations.get(r.id)?.title ?? r.title,
    cleanTitle: antragTitleTranslations.get(r.id)?.cleanTitle ?? r.cleanTitle,
    beratungsstand: r.beratungsstand,
    introducedDate: r.introducedDate,
    drucksachePdfUrl: r.drucksachePdfUrl,
    sachgebiet: r.sachgebiet ?? [],
    signatoryCount: initiativeCountById.get(r.id) ?? 1,
    linkedVotes: initiativeVotesById.get(r.id) ?? [],
  }))
}
