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
  assert.deepEqual(reviewedSourceMetadata().map((source) => source.id), [334134, 335940, 338352, 338353, 338354, 338356, 338358, 338359, 338361, 338362, 338368, 338369, 338370, 338371, 338372, 338407, 338411, 338436, 338523, 338552])
  assert.equal(new Set(reviewedSourceMetadata().map((source) => source.drucksache)).size, 20)
  assert.equal(reviewedSourceMetadata().every((source) => /^[a-f0-9]{64}$/.test(source.sourceHash)), true)
  assert.equal(sourceTextHash('reviewed fixture'), 'ce9a85bb5c5d562b77484cc44e2e9fd032a39c75223137ff944905a2aed5224b')
  assert.deepEqual(reviewedPinMetadata().map((source) => source.id), [334134, 335940, 338347, 338352, 338353, 338354, 338356, 338358, 338359, 338361, 338362, 338363, 338365, 338367, 338368, 338369, 338370, 338371, 338407, 338411, 338436, 338523, 338552])
  assert.equal(reviewedPinMetadata().every((source) => [source.deSourceHash, source.enSourceHash].filter(Boolean).every((hash) => /^[a-f0-9]{64}$/.test(hash))), true)
  assert.deepEqual(reviewedTitlePinMetadata().map((source) => source.id), [334134, 335940, 338352, 338355, 338372, 338407, 338410, 338411])
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

test('August 29 source reviews preserve legal thresholds and mandatory rules', () => {
  const israel = applyReviewedFields(334134, 'de', '21/7733', '989d8e571773506238d29cd2b2813e36bce0a06d38fff2b8eb18506db4f0d72a', {
    summary_simplified: 'arbitrary',
    summary_detail: 'arbitrary',
  })
  assert.match(israel.summary_simplified, /fördern kann/)
  assert.match(israel.summary_simplified, /Handlungen der israelischen Regierung/)
  assert.match(israel.summary_detail, /Verbreiten eines von der neuen Regel erfassten Inhalts aus dem Ausland/)
  assert.match(israel.summary_detail, /nur unter zusätzlichen Voraussetzungen gelten/)
  assert.match(israel.summary_detail, /deutschen Öffentlichkeit zugänglich gemacht/)
  assert.match(israel.summary_detail, /geeignet sein, den öffentlichen Frieden zu stören/)
  assert.match(israel.summary_detail, /deutsche Staatsangehörigkeit besitzen oder ihre Lebensgrundlage in Deutschland haben/)
  assert.doesNotMatch(israel.summary_detail, /wenn die Tat im Ausland begangen wird/)
  assert.match(israel.summary_detail, /erhebliches verfassungsrechtliches Risiko/)
  assert.throws(() => assertReviewedFields(334134, 'de', germanDescriptionReviewForHash(334134, '21/7733', '989d8e571773506238d29cd2b2813e36bce0a06d38fff2b8eb18506db4f0d72a'), {
    ...israel,
    summary_detail: `${israel.summary_detail} Durch eine weitere Änderung des Strafgesetzbuches soll deutsches Strafrecht auch auf den neuen Tatbestand angewandt werden, wenn die Tat im Ausland begangen wird.`,
  }), /retains forbidden text/)

  const israelEnglish = applyReviewedFields(334134, 'en', '21/7733', '816463b61eb26666951c6ad052e835bb39c95690668cf83739ee0b3e4a48632d', {
    summary_simplified: 'arbitrary',
    summary_detail: 'arbitrary',
  })
  assert.match(israelEnglish.summary_detail, /disseminating material covered by the new provision from abroad/)
  assert.match(israelEnglish.summary_detail, /only under additional conditions/)
  assert.match(israelEnglish.summary_detail, /accessible to the German public/)
  assert.match(israelEnglish.summary_detail, /capable of disturbing public peace/)
  assert.match(israelEnglish.summary_detail, /German national or have their livelihood in Germany/)
  assert.doesNotMatch(israelEnglish.summary_detail, /applicable to the new offense when it is committed abroad/)
  assert.throws(() => assertReviewedFields(334134, 'en', englishDescriptionReview(334134, '21/7733'), {
    ...israelEnglish,
    summary_detail: `${israelEnglish.summary_detail} A further amendment to the Criminal Code would make German criminal law applicable to the new offense when it is committed abroad.`,
  }), /retains forbidden text/)
  assert.equal(
    applyReviewedTitleFields(334134, 'de', '21/7733', '7005975523b694bda158f81ac402d5b287e4c72da088c319ab98144eebefb6ae', { clean_title: 'arbitrary' }).clean_title,
    'Israels Existenzrechtsleugnung bei Eignung zu antisemitischer Gewalt oder Willkür ahnden',
  )
  assert.equal(reviewedGermanTitle(334134, '21/7733', '7005975523b694bda158f81ac402d5b287e4c72da088c319ab98144eebefb6ae', 'arbitrary').length <= 90, true)
  assert.equal(
    applyReviewedTitleFields(334134, 'en', '21/7733', '1fdac7ba8ca38bc81e278167c22ac6b5f7f43c6c4c5b7bacc8751141c1749b60', { clean_title: 'arbitrary' }).clean_title,
    "Punish denial of Israel's right to exist if it can encourage antisemitic violence or arbitrary acts",
  )

  const privacy = applyReviewedFields(335940, 'de', '21/7732', '1ea835e0e708f002ffbdb5e16521446abd6b8afbbe8a45f8567d6030fdf128e9', {
    summary_simplified: 'arbitrary',
    summary_detail: 'arbitrary',
  })
  assert.match(privacy.summary_simplified, /ohne wesentliche Änderungen/)
  assert.match(privacy.summary_detail, /Tag nach seiner Verkündung/)
  assert.equal(
    applyReviewedTitleFields(335940, 'en', '21/7732', 'a70a8a596c3cb8b5a15ffa8d18f0f88b2da2f06b9107717a26049bb374ca6b23', { clean_title: 'arbitrary' }).clean_title,
    'Establish the Data Protection Conference in law and coordinate supervision across German states',
  )
  assert.throws(() => applyReviewedTitleFields(335940, 'en', '21/7732', 'changed', { clean_title: 'arbitrary' }), /title input hash mismatch/)

  const rent = applyReviewedFields(338552, 'de', '21/7688', '0317bc265a9fad1a4426a7ade7c19fd7fddf4420767ecef9e468c19ae3497d68', {
    summary_simplified: 'arbitrary',
    summary_detail: 'arbitrary',
  })
  assert.match(rent.summary_detail, /ist dort ein Inflationsausgleich von höchstens zwei Prozent pro Jahr zu gestatten/)
  assert.match(rent.summary_detail, /in allen drei Gebietstypen eine Härtefallregelung/)
  assert.match(rent.summary_detail, /Modernisierungsumlage aber abgeschafft/)
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
