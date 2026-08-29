import assert from 'node:assert/strict'
import test from 'node:test'
import { REVIEWED_PIN as PIN_334134 } from '../antrag-descriptions/reviewedPins/334134.mjs'
import { REVIEWED_PIN as PIN_335940 } from '../antrag-descriptions/reviewedPins/335940.mjs'
import { REVIEWED_PIN as PIN_338552 } from '../antrag-descriptions/reviewedPins/338552.mjs'
import { prepareReviewedAntragTranslation, prepareReviewedAntragTranslationForHash, reviewedTranslationPromptRows } from './reviewedTranslation.mjs'

test('reviewed prompt rows include source-bound requirements', () => {
  const [row] = reviewedTranslationPromptRows([{ antrag_id: 338352, drucksache: '457/26', title: 'BAföG' }])
  assert.match(row.review_requirements.summary_simplified.required[0], /progress certificate/)
  assert.throws(() => reviewedTranslationPromptRows([{ antrag_id: 338352, drucksache: '458/26' }]), /Drucksache mismatch/)
})

test('reviewed translation pins converge before validation', () => {
  const source = {
    id: 338368,
    drucksache: '445/26',
    summary_simplified: 'Der Staat zahlt 10 Euro. Zusätzlich sind 6 840 Euro erlaubt. Die Altersgrenze ist 65.',
    summary_detail: 'Kinder ab 2020 erhalten 10 Euro. Ab 2027 sind 6 840 Euro erlaubt. Die Altersgrenze ist 65. Die Kosten steigen von 198 Millionen Euro auf 411 Millionen Euro bis 2030.',
  }
  const { sourceHash, translated } = prepareReviewedAntragTranslationForHash(source, '2d44d26dde157d9a297f13de728c6c69cc0c964700d50eaf76eafa755b519ee0', {
    summary_simplified: 'arbitrary',
    summary_detail: 'arbitrary',
  })
  assert.equal(sourceHash, '2d44d26dde157d9a297f13de728c6c69cc0c964700d50eaf76eafa755b519ee0')
  assert.match(translated.summary_simplified, /6,840 euros per year/)
  assert.match(translated.summary_detail, /children born in \*\*2020\*\*/)
  assert.throws(() => prepareReviewedAntragTranslation(source, { summary_simplified: 'arbitrary', summary_detail: 'arbitrary' }), /input hash mismatch/)
})

test('unmapped translations retain numeric validation', () => {
  assert.throws(() => prepareReviewedAntragTranslation({
    id: 1,
    drucksache: '1/1',
    summary_simplified: 'Der Betrag beträgt 265.000 Euro.',
    summary_detail: 'Der Betrag beträgt 265.000 Euro.',
  }, {
    summary_simplified: 'The amount is 265.000 euros.',
    summary_detail: 'The amount is 265.000 euros.',
  }), /must contain 265,000/)
})

test('August 29 English pins remain source-bound and numerically valid', () => {
  for (const [id, pin] of [PIN_334134, PIN_335940, PIN_338552]) {
    const { translated } = prepareReviewedAntragTranslationForHash({
      id,
      drucksache: pin.drucksache,
      summary_simplified: pin.de.summary_simplified,
      summary_detail: pin.de.summary_detail,
    }, pin.enSourceHash, {
      summary_simplified: 'arbitrary',
      summary_detail: 'arbitrary',
    })
    assert.deepEqual(translated, pin.en)
  }
})
