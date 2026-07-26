import type { BerlinCandidatePortraitInput, CandidatePortraitStatus } from '@machtblick/berlin-db/types'

const statuses = new Set<CandidatePortraitStatus>(['licensed', 'official_source'])
const requiredFields = ['candidateSlug', 'imageUrl', 'sourceUrl', 'publisher', 'status', 'provenance', 'retrievedAt'] as const
const optionalFields = ['author', 'license', 'licenseUrl'] as const

export function validateCandidatePortraits(records: unknown, candidateSlugs: ReadonlySet<string>): BerlinCandidatePortraitInput[] {
  if (!Array.isArray(records)) throw new Error('Candidate portraits must be a JSON array')
  const seenCandidates = new Set<string>()
  const seenImages = new Set<string>()
  return records.map((record, index) => {
    if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error(`Candidate portrait ${index + 1} must be an object`)
    const values = record as Record<string, unknown>
    for (const field of requiredFields) {
      if (typeof values[field] !== 'string' || values[field].trim() === '') throw new Error(`Candidate portrait ${index + 1} has no ${field}`)
    }
    for (const field of optionalFields) {
      if (values[field] !== undefined && (typeof values[field] !== 'string' || values[field].trim() === '')) {
        throw new Error(`Candidate portrait ${index + 1} has an invalid ${field}`)
      }
    }
    const portrait = values as BerlinCandidatePortraitInput
    if (!candidateSlugs.has(portrait.candidateSlug)) throw new Error(`Unknown portrait candidate: ${portrait.candidateSlug}`)
    if (seenCandidates.has(portrait.candidateSlug)) throw new Error(`Duplicate portrait candidate: ${portrait.candidateSlug}`)
    if (seenImages.has(portrait.imageUrl)) throw new Error(`Duplicate portrait image: ${portrait.imageUrl}`)
    if (!statuses.has(portrait.status)) throw new Error(`Invalid portrait status for ${portrait.candidateSlug}: ${portrait.status}`)
    if (portrait.status === 'licensed' && !portrait.license) throw new Error(`Licensed portrait has no license: ${portrait.candidateSlug}`)
    for (const field of ['imageUrl', 'sourceUrl', ...(portrait.licenseUrl ? ['licenseUrl' as const] : [])]) {
      if (!portrait[field] || !URL.canParse(portrait[field])) throw new Error(`Invalid portrait ${field} for ${portrait.candidateSlug}`)
      if (!['https:', 'http:'].includes(new URL(portrait[field]).protocol)) throw new Error(`Invalid portrait ${field} for ${portrait.candidateSlug}`)
    }
    if (Number.isNaN(Date.parse(portrait.retrievedAt))) throw new Error(`Invalid portrait retrieval date: ${portrait.candidateSlug}`)
    seenCandidates.add(portrait.candidateSlug)
    seenImages.add(portrait.imageUrl)
    return portrait
  })
}
