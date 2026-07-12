import type Database from 'better-sqlite3'
import type { Locale } from '../src/lib/locale'

export type VoteTranslation = {
  vote_id: string
  title: string
  clean_title: string | null
  topic: string | null
  subject: string | null
  summary: string | null
  summary_simplified: string | null
  summary_detail: string | null
}

export type SpeechTranslation = {
  speech_id: string
  text_excerpt: string
  text_full: string
}

export type PartySummaryTranslation = {
  vote_id: string
  party: string
  position_summary: string | null
  key_points: string | null
  dissent_note: string | null
}

export type MotionTranslation = {
  antrag_id: number
  title: string | null
  clean_title: string | null
  summary_simplified: string | null
  summary_detail: string | null
}

export type StaticTranslations = {
  votes: Map<string, VoteTranslation>
  speeches: Map<string, SpeechTranslation>
  partySummaries: Map<string, PartySummaryTranslation>
  motions: Map<number, MotionTranslation>
}

export function partySummaryTranslationKey(voteId: string, party: string) {
  return `${voteId}\u0000${party}`
}

export function loadStaticTranslations(db: Database.Database): StaticTranslations {
  return {
    votes: new Map(
      (db.prepare(`
        SELECT vote_id, title, clean_title, topic, subject, summary, summary_simplified, summary_detail
        FROM vote_translations
        WHERE locale = 'en'
      `).all() as VoteTranslation[]).map((row) => [row.vote_id, row]),
    ),
    speeches: new Map(
      (db.prepare(`
        SELECT speech_id, text_excerpt, text_full
        FROM speech_translations
        WHERE locale = 'en'
      `).all() as SpeechTranslation[]).map((row) => [row.speech_id, row]),
    ),
    partySummaries: new Map(
      (db.prepare(`
        SELECT vote_id, party, position_summary, key_points, dissent_note
        FROM vote_party_summary_translations
        WHERE locale = 'en'
      `).all() as PartySummaryTranslation[]).map((row) => [partySummaryTranslationKey(row.vote_id, row.party), row]),
    ),
    motions: new Map(
      (db.prepare(`
        SELECT antrag_id, title, clean_title, summary_simplified, summary_detail
        FROM antrag_description_translations
        WHERE locale = 'en'
      `).all() as MotionTranslation[]).map((row) => [row.antrag_id, row]),
    ),
  }
}

export function voteTranslation(translations: StaticTranslations, locale: Locale, voteId: string) {
  return locale === 'en' ? translations.votes.get(voteId) : undefined
}

export function speechTranslation(translations: StaticTranslations, locale: Locale, speechId: string) {
  return locale === 'en' ? translations.speeches.get(speechId) : undefined
}

export function partySummaryTranslation(
  translations: StaticTranslations,
  locale: Locale,
  voteId: string,
  party: string,
) {
  return locale === 'en' ? translations.partySummaries.get(partySummaryTranslationKey(voteId, party)) : undefined
}

export function motionTranslation(translations: StaticTranslations, locale: Locale, motionId: number) {
  return locale === 'en' ? translations.motions.get(motionId) : undefined
}
