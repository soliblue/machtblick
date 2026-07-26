import assert from 'node:assert/strict'
import test from 'node:test'
import { validateCandidatePortraits } from './portraits.ts'

const portrait = {
  candidateSlug: 'candidate-a',
  imageUrl: 'https://example.com/candidate-a.jpg',
  sourceUrl: 'https://example.com/candidate-a',
  publisher: 'Example',
  license: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0',
  status: 'licensed',
  provenance: 'Official candidate profile',
  retrievedAt: '2026-07-26'
}

test('accepts a known candidate with complete provenance', () => {
  assert.deepEqual(validateCandidatePortraits([portrait], new Set(['candidate-a'])), [portrait])
})

test('rejects duplicate candidates and images', () => {
  assert.throws(
    () => validateCandidatePortraits([portrait, { ...portrait, imageUrl: 'https://example.com/other.jpg' }], new Set(['candidate-a'])),
    /Duplicate portrait candidate/
  )
  assert.throws(
    () => validateCandidatePortraits([portrait, { ...portrait, candidateSlug: 'candidate-b' }], new Set(['candidate-a', 'candidate-b'])),
    /Duplicate portrait image/
  )
})

test('rejects unknown candidates', () => {
  assert.throws(() => validateCandidatePortraits([portrait], new Set()), /Unknown portrait candidate/)
})

test('rejects licensed portraits without a license', () => {
  assert.throws(
    () => validateCandidatePortraits([{ ...portrait, license: undefined }], new Set(['candidate-a'])),
    /Licensed portrait has no license/
  )
})

test('rejects an invalid license URL', () => {
  assert.throws(
    () => validateCandidatePortraits([{ ...portrait, licenseUrl: 'creativecommons.org' }], new Set(['candidate-a'])),
    /Invalid portrait licenseUrl/
  )
})
