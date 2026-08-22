import { applyReviewedFields, assertReviewedFields, englishDescriptionReview } from '../antrag-descriptions/reviewedCorrections.mjs'
import { assertEnglishNumberFormatting } from '../preprocessing/englishNumbers.mjs'
import { antragDescriptionSourceHash } from './sourceHash.mjs'

export function reviewedTranslationPromptRows(rows) {
  return rows.map((row) => ({ ...row, review_requirements: englishDescriptionReview(row.antrag_id, row.drucksache) }))
}

export function prepareReviewedAntragTranslation(source, generated) {
  return prepareReviewedAntragTranslationForHash(source, antragDescriptionSourceHash(source.summary_simplified, source.summary_detail), generated)
}

export function prepareReviewedAntragTranslationForHash(source, sourceHash, generated) {
  const translated = applyReviewedFields(source.id, 'en', source.drucksache, sourceHash, generated)
  if (!translated) throw new Error(`missing Antrag translation for ${source.id}`)
  assertEnglishNumberFormatting(source.summary_simplified, translated.summary_simplified)
  assertEnglishNumberFormatting(source.summary_detail, translated.summary_detail)
  assertReviewedFields(source.id, 'en', englishDescriptionReview(source.id, source.drucksache), translated)
  return { sourceHash, translated }
}
