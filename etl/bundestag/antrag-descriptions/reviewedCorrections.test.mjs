import assert from 'node:assert/strict'
import test from 'node:test'
import { buildPrompt } from '../descriptions/prompt.mjs'
import {
  applyReviewedFields,
  applyReviewedTitleFields,
  assertReviewedFields,
  assertReviewedSourceHash,
  englishDescriptionReview,
  germanDescriptionReviewForHash,
  hasReviewedGermanTitle,
  reviewedSourceMetadata,
  reviewedEnglishTitle,
  reviewedGermanTitle,
  reviewedPinMetadata,
  shouldSkipGermanTitle,
  sourceTextHash,
  reviewedTitlePinMetadata,
} from './reviewedCorrections.mjs'

test('reviewed correction metadata covers every source without cached fixtures', () => {
  assert.deepEqual(reviewedSourceMetadata().map((source) => source.id), [338352, 338353, 338354, 338356, 338358, 338359, 338361, 338362, 338368, 338369, 338370, 338371, 338372, 338407, 338411, 338436, 338523])
  assert.equal(new Set(reviewedSourceMetadata().map((source) => source.drucksache)).size, 17)
  assert.equal(reviewedSourceMetadata().every((source) => /^[a-f0-9]{64}$/.test(source.sourceHash)), true)
  assert.equal(sourceTextHash('reviewed fixture'), 'ce9a85bb5c5d562b77484cc44e2e9fd032a39c75223137ff944905a2aed5224b')
  assert.deepEqual(reviewedPinMetadata().map((source) => source.id), [338347, 338352, 338353, 338354, 338356, 338358, 338359, 338361, 338362, 338363, 338365, 338367, 338368, 338369, 338370, 338371, 338407, 338411, 338436, 338523])
  assert.equal(reviewedPinMetadata().every((source) => [source.deSourceHash, source.enSourceHash].filter(Boolean).every((hash) => /^[a-f0-9]{64}$/.test(hash))), true)
  assert.deepEqual(reviewedTitlePinMetadata().map((source) => source.id), [338352, 338355, 338372, 338407, 338410, 338411])
  assert.equal(reviewedTitlePinMetadata().every((source) => [source.deSourceHash, source.enSourceHash].filter(Boolean).every((hash) => /^[a-f0-9]{64}$/.test(hash))), true)
})

test('reviewed corrections fail on source and Drucksache mismatches', () => {
  assert.doesNotThrow(() => assertReviewedSourceHash(338352, '457/26', '20b66c42f36b801e9ae1f486b188346b59ba71a55726cbf8abe8b9f490fcb417'))
  assert.throws(() => assertReviewedSourceHash(338352, '457/26', sourceTextHash('changed')), /source hash mismatch/)
  assert.throws(() => englishDescriptionReview(338352, '458/26'), /Drucksache mismatch/)
})

test('reviewed fields require approved text and reject superseded text', () => {
  const review = germanDescriptionReviewForHash(338356, '461/26', '32c7b77efccf0718f3a1020ecc39d361b433cc14dbcbd4b28543e99f41ece78e')
  const output = Object.fromEntries(Object.entries(review).map(([field, requirements]) => [field, requirements.required.join(' ')]))
  assert.doesNotThrow(() => assertReviewedFields(338356, 'de', review, output))
  assert.throws(() => assertReviewedFields(338356, 'de', review, { summary_detail: review.summary_detail.required.slice(0, 2).join(' ') }), /missing required text/)
  assert.throws(() => assertReviewedFields(338356, 'de', review, { ...output, summary_detail: `${output.summary_detail} 10 12 Neutronen` }), /retains forbidden text/)
  assert.doesNotThrow(() => assertReviewedFields(338368, 'en', englishDescriptionReview(338368, '445/26'), {
    summary_simplified: 'Additional private contributions of up to 6,840 euros per year will be permitted.',
    summary_detail: 'Additional private contributions of up to 6,840 euros per calendar year will be permitted.',
  }))
})

test('unmapped rows pass through and reviewed titles are pinned', () => {
  assert.equal(germanDescriptionReviewForHash(1, '1/1', sourceTextHash('anything')), null)
  assert.equal(reviewedGermanTitle(1, '1/1', 'unmapped', 'Generated'), 'Generated')
  assert.equal(hasReviewedGermanTitle(338372, '472/26', '2f7c2999c53dfb48bef255fd033596f0a16a8120f8061bcf3a029c843972ae53'), true)
  assert.equal(shouldSkipGermanTitle(338372, '472/26', '2f7c2999c53dfb48bef255fd033596f0a16a8120f8061bcf3a029c843972ae53', 'low'), false)
  assert.equal(shouldSkipGermanTitle(1, '1/1', 'unmapped', 'low'), true)
  assert.equal(reviewedGermanTitle(338372, '472/26', '2f7c2999c53dfb48bef255fd033596f0a16a8120f8061bcf3a029c843972ae53', 'Offshore-Häfen'), 'Kraftwerke, Speicher und Hafenanlagen für Offshore-Netzplattformen schneller genehmigen')
  assert.equal(reviewedEnglishTitle(338372, '472/26', '7794cb30a23e49fa090e79ff40fda818280b1ae6a9a152e07ae0152c28c76867', 'offshore ports'), 'Speed approvals for power plants, storage and onshore port works for offshore grid platforms')
  assert.throws(() => reviewedGermanTitle(338372, '472/26', 'changed', 'Offshore-Häfen'), /de title input hash mismatch/)
  assert.throws(() => reviewedEnglishTitle(338372, '472/26', 'changed', 'offshore ports'), /en title input hash mismatch/)
})

test('reviewed full-field pins replace arbitrary model output and bind the input hash', () => {
  const output = applyReviewedFields(338368, 'en', '445/26', '2d44d26dde157d9a297f13de728c6c69cc0c964700d50eaf76eafa755b519ee0', {
    summary_simplified: 'arbitrary',
    summary_detail: 'arbitrary',
  })
  assert.match(output.summary_simplified, /6,840 euros per year/)
  assert.match(output.summary_detail, /children born in \*\*2020\*\*/)
  assert.throws(
    () => applyReviewedFields(338368, 'en', '445/26', 'changed', { summary_simplified: 'arbitrary', summary_detail: 'arbitrary' }),
    /input hash mismatch/,
  )
  const german = applyReviewedFields(338352, 'de', '457/26', '20b66c42f36b801e9ae1f486b188346b59ba71a55726cbf8abe8b9f490fcb417', {
    summary_simplified: 'arbitrary',
    summary_detail: 'arbitrary',
  })
  assert.match(german.summary_simplified, /Leistungsnachweis/)
  assert.match(german.summary_detail, /Leistungsnachweis/)
  assert.throws(
    () => applyReviewedFields(338352, 'de', '457/26', 'changed', { summary_simplified: 'arbitrary', summary_detail: 'arbitrary' }),
    /input hash mismatch/,
  )
})

test('reviewed title pins replace complete affected fields', () => {
  const translated = applyReviewedTitleFields(338407, 'en', '475/26', 'd3bbec44b7dc4ccda8a40909013470a9e5dc4bd51b54f2201cf2af0ee69bd092', {
    title: 'Act of 16. December 2025',
    clean_title: 'Generated',
  })
  assert.equal(translated.title, 'Act on the Convention of 16 December 2025 Establishing an International Claims Commission for Ukraine')
  assert.equal(translated.clean_title, 'Generated')
  assert.throws(
    () => applyReviewedTitleFields(338407, 'en', '475/26', 'changed', { title: 'Generated' }),
    /title input hash mismatch/,
  )
})

test('reviewed requirements are appended after source truncation', () => {
  const required = 'Diese geprüfte Einschränkung liegt hinter dem abgeschnittenen Quelltext.'
  const prompt = buildPrompt('Titel', 'x'.repeat(40000), 'antrag', { summary_detail: { required: [required] } })
  assert.equal(prompt.includes('x'.repeat(30001)), false)
  assert.equal(prompt.includes(required), true)
  assert.equal(prompt.indexOf(required) > prompt.lastIndexOf('x'.repeat(100)), true)
})
