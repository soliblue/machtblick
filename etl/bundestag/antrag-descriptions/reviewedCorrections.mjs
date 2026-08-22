import { createHash } from 'node:crypto'
import { REVIEWED_GUIDANCE } from './reviewedPins/guidance.mjs'
import { REVIEWED_PINS } from './reviewedPins/index.mjs'
import { REVIEWED_TITLE_PINS } from './reviewedPins/titles.mjs'

export function germanDescriptionReview(id, drucksache, text) {
  return germanDescriptionReviewForHash(id, drucksache, sourceTextHash(text))
}

export function germanDescriptionReviewForHash(id, drucksache, hash) {
  const correction = assertReviewedSourceHash(id, drucksache, hash)
  return correction?.de ?? null
}

export function assertReviewedSource(id, drucksache, text) {
  return assertReviewedSourceHash(id, drucksache, sourceTextHash(text))
}

export function assertReviewedSourceHash(id, drucksache, hash) {
  const correction = checkedGuidance(id, drucksache)
  if (correction && hash !== correction.sourceHash) throw new Error(`reviewed source hash mismatch for Antrag ${id}`)
  return correction
}

export function sourceTextHash(text) {
  return createHash('sha256').update(text).digest('hex')
}

export function reviewedSourceMetadata() {
  return [...REVIEWED_GUIDANCE].map(([id, correction]) => ({ id, drucksache: correction.drucksache, sourceHash: correction.sourceHash }))
}

export function englishDescriptionReview(id, drucksache) {
  return checkedGuidance(id, drucksache)?.en ?? null
}

export function reviewedGermanTitle(id, drucksache, sourceHash, generated) {
  return applyReviewedTitleFields(id, 'de', drucksache, sourceHash, { clean_title: generated }).clean_title
}

export function hasReviewedGermanTitle(id, drucksache, sourceHash) {
  return reviewedGermanTitle(id, drucksache, sourceHash, null) !== null
}

export function shouldSkipGermanTitle(id, drucksache, sourceHash, confidence) {
  return confidence === 'low' && !hasReviewedGermanTitle(id, drucksache, sourceHash)
}

export function reviewedEnglishTitle(id, drucksache, sourceHash, generated) {
  return applyReviewedTitleFields(id, 'en', drucksache, sourceHash, { clean_title: generated }).clean_title
}

export function assertReviewedFields(id, locale, review, output) {
  if (!review) return
  for (const [field, requirements] of Object.entries(review)) {
    const value = fold(output[field])
    for (const fragment of requirements.required ?? []) {
      if (!hasFragment(value, fragment)) throw new Error(`reviewed ${locale} ${field} missing required text for Antrag ${id}: ${fragment}`)
    }
    for (const fragment of requirements.forbidden ?? []) {
      if (hasFragment(value, fragment)) throw new Error(`reviewed ${locale} ${field} retains forbidden text for Antrag ${id}: ${fragment}`)
    }
  }
}

export function applyReviewedFields(id, locale, drucksache, sourceHash, generated) {
  const correction = REVIEWED_PINS.get(Number(id))
  if (correction && correction.drucksache !== drucksache) throw new Error(`reviewed pin Drucksache mismatch for Antrag ${id}: ${drucksache}`)
  const pins = correction?.[locale]
  if (!pins || !generated) return generated
  if (correction[`${locale}SourceHash`] !== sourceHash) throw new Error(`reviewed ${locale} input hash mismatch for Antrag ${id}`)
  return { ...generated, ...pins }
}

export function applyReviewedTitleFields(id, locale, drucksache, sourceHash, generated) {
  const correction = REVIEWED_TITLE_PINS.get(Number(id))
  if (correction && correction.drucksache !== drucksache) throw new Error(`reviewed title Drucksache mismatch for Antrag ${id}: ${drucksache}`)
  const pins = correction?.[locale]
  if (!pins || !generated) return generated
  if (correction[`${locale}SourceHash`] !== sourceHash) throw new Error(`reviewed ${locale} title input hash mismatch for Antrag ${id}`)
  return { ...generated, ...pins }
}

export function reviewedPinMetadata() {
  return [...REVIEWED_PINS].map(([id, correction]) => ({
    id,
    drucksache: correction.drucksache,
    deSourceHash: correction.deSourceHash,
    enSourceHash: correction.enSourceHash,
    deFields: Object.keys(correction.de ?? {}),
    enFields: Object.keys(correction.en ?? {}),
  }))
}

export function reviewedTitlePinMetadata() {
  return [...REVIEWED_TITLE_PINS].map(([id, correction]) => ({
    id,
    drucksache: correction.drucksache,
    deSourceHash: correction.deSourceHash,
    enSourceHash: correction.enSourceHash,
    deFields: Object.keys(correction.de ?? {}),
    enFields: Object.keys(correction.en ?? {}),
  }))
}

function checkedGuidance(id, drucksache) {
  const correction = REVIEWED_GUIDANCE.get(Number(id))
  if (correction && correction.drucksache !== drucksache) throw new Error(`reviewed Drucksache mismatch for Antrag ${id}: ${drucksache}`)
  return correction
}

function fold(value) {
  return String(value ?? '').toLocaleLowerCase('de-DE').replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim()
}

function hasFragment(value, fragment) {
  return ` ${value} `.includes(` ${fold(fragment)} `)
}
