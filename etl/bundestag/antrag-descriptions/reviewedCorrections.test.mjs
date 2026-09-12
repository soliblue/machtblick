import assert from 'node:assert/strict'
import test from 'node:test'
import { antragDescriptionSourceHash } from '../antrag-description-translations/sourceHash.mjs'
import { buildPrompt } from '../descriptions/prompt.mjs'
import { REVIEWED_PINS } from './reviewedPins/index.mjs'
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
  assert.deepEqual(reviewedSourceMetadata().map((source) => source.id), [334134, 334474, 334557, 334922, 335448, 335462, 335466, 335476, 335477, 335555, 335940, 338331, 338352, 338353, 338354, 338356, 338358, 338359, 338361, 338362, 338364, 338368, 338369, 338370, 338371, 338372, 338407, 338411, 338436, 338523, 338552, 338785, 338848, 338894, 338914, 338965])
  assert.equal(reviewedSourceMetadata().length, 36)
  assert.equal(new Set(reviewedSourceMetadata().map((source) => source.drucksache)).size, 36)
  assert.equal(reviewedSourceMetadata().every((source) => /^[a-f0-9]{64}$/.test(source.sourceHash)), true)
  assert.equal(sourceTextHash('reviewed fixture'), 'ce9a85bb5c5d562b77484cc44e2e9fd032a39c75223137ff944905a2aed5224b')
  assert.deepEqual(reviewedPinMetadata().map((source) => source.id), [334134, 334474, 334557, 334922, 335448, 335462, 335466, 335476, 335477, 335555, 335940, 338331, 338347, 338352, 338353, 338354, 338356, 338358, 338359, 338361, 338362, 338363, 338364, 338365, 338367, 338368, 338369, 338370, 338371, 338407, 338411, 338436, 338523, 338552, 338785, 338848, 338894, 338914, 338965])
  assert.equal(reviewedPinMetadata().length, 39)
  assert.equal(reviewedPinMetadata().every((source) => [source.deSourceHash, source.enSourceHash].filter(Boolean).every((hash) => /^[a-f0-9]{64}$/.test(hash))), true)
  assert.deepEqual(reviewedTitlePinMetadata().map((source) => source.id), [334134, 334554, 335940, 338352, 338355, 338372, 338407, 338410, 338411, 338788, 338869])
  assert.equal(reviewedTitlePinMetadata().length, 11)
  assert.equal(reviewedTitlePinMetadata().every((source) => [source.deSourceHash, source.enSourceHash].filter(Boolean).every((hash) => /^[a-f0-9]{64}$/.test(hash))), true)
})

test('reviewed corrections fail on source and Drucksache mismatches', () => {
  assert.doesNotThrow(() => assertReviewedSourceHash(338352, '457/26', '20b66c42f36b801e9ae1f486b188346b59ba71a55726cbf8abe8b9f490fcb417'))
  assert.throws(() => assertReviewedSourceHash(338352, '457/26', sourceTextHash('changed')), /source hash mismatch/)
  assert.throws(() => englishDescriptionReview(338352, '458/26'), /Drucksache mismatch/)
})

test('complete German pins bind English input to the exact German pair', () => {
  for (const [id, pin] of REVIEWED_PINS) {
    if (pin.de?.summary_simplified && pin.de?.summary_detail && pin.enSourceHash) {
      assert.equal(
        antragDescriptionSourceHash(pin.de.summary_simplified, pin.de.summary_detail),
        pin.enSourceHash,
        `Antrag ${id} English input hash`,
      )
    }
  }
})

test('reviewed fields require approved text and reject superseded text', () => {
  const review = germanDescriptionReviewForHash(338356, '461/26', '32c7b77efccf0718f3a1020ecc39d361b433cc14dbcbd4b28543e99f41ece78e')
  const output = Object.fromEntries(Object.entries(review).map(([field, requirements]) => [field, requirements.required.join(' ')]))
  assert.doesNotThrow(() => assertReviewedFields(338356, 'de', review, output))
  assert.throws(() => assertReviewedFields(338356, 'de', review, { summary_detail: review.summary_detail.required.slice(0, 2).join(' ') }), /missing required text/)
  assert.throws(() => assertReviewedFields(338356, 'de', review, { ...output, summary_detail: `${output.summary_detail} 10 12 Neutronen` }), /retains forbidden text/)
  assert.doesNotThrow(() => assertReviewedFields(338368, 'en', englishDescriptionReview(338368, '21/7864'), {
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
  const output = applyReviewedFields(338368, 'en', '21/7864', '2d44d26dde157d9a297f13de728c6c69cc0c964700d50eaf76eafa755b519ee0', {
    summary_simplified: 'arbitrary',
    summary_detail: 'arbitrary',
  })
  assert.match(output.summary_simplified, /6,840 euros per year/)
  assert.match(output.summary_detail, /children born in \*\*2020\*\*/)
  assert.throws(
    () => applyReviewedFields(338368, 'en', '21/7864', 'changed', { summary_simplified: 'arbitrary', summary_detail: 'arbitrary' }),
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

test('September 12 reviews preserve every source-backed correction', () => {
  const reviews = [
    [338331, '21/7870', 'd24c8c3e04de3172a21516fb563d29f4409f62da25d67627eee63d28943815e2'],
    [338364, '21/7872', 'ade9c7d0451d80c021eeb460dc5e8acaaac8600b1174cfaef60b628d87edf45c'],
    [338785, '505/26', 'fe5e2398aae96a94115d447c8abb35ed00eaa3dbd03d400769d152acde05c35c'],
    [338848, '510/26', 'f01cfe2fe06b87933f7509ad815ecd1d770b176c54d8b757330c9312c237495e'],
    [338894, '21/7669', '90c3de6a898a501b184788b69fc68d2e7544c9166e8d0e1b03442733dd390bde'],
    [338914, '21/7899', 'ea21504b2f63b43dd5035b95d1f9f5e9da9f3c081e5c729dc17f5ca8b632606d'],
    [338965, '21/7970', '2e2a80930dd99cc8f3aabdd01f860a5cb671b225a991f55866dcbcb0e26c8f08'],
  ]
  for (const [id, drucksache, hash] of reviews) {
    const review = germanDescriptionReviewForHash(id, drucksache, hash)
    const output = applyReviewedFields(id, 'de', drucksache, hash, {
      summary_simplified: 'arbitrary',
      summary_detail: 'arbitrary',
    })
    assert.doesNotThrow(() => assertReviewedFields(id, 'de', review, output))
    assert.throws(() => applyReviewedFields(id, 'de', drucksache, 'changed', output), /input hash mismatch/)
    for (const [field, requirements] of Object.entries(review)) {
      for (const forbidden of requirements.forbidden ?? []) {
        assert.equal(output[field].includes(forbidden), false, `${id} de ${field} retains ${forbidden}`)
        assert.throws(
          () => assertReviewedFields(id, 'de', review, { ...output, [field]: `${output[field]} ${forbidden}` }),
          /retains forbidden text/,
        )
      }
    }
  }
})

test('Bundestag source migrations preserve approved descriptions and translation inputs', () => {
  const reviews = [
    [338361, '21/7867', 'a24b0465012d93e35ebda4134fee3f59694b6a04d46e15bc535049de22ffe60e', 'd38f94789051eb4846ce8fcc3c232361b853a90536bdd272d5963e8eb7648f23'],
    [338362, '21/7871', '545935c4cdea39a20eb0137ce47ebda8ccac28cb18f53eaa542eba54f1952b94', '280f3c1e633004eb784a18f06a25186cd681159c75a6398dd687baa8d9c66695'],
    [338367, '21/7859', '4735129870157cb74041d7b1e60d145a3f83eed311b9f26dd098035c06bae12e', '2d442ff2ecc8cca0abda07d073e49c402d023aa67bac74771d0fedf6647d430f'],
    [338368, '21/7864', 'fb3ac3a15ac5ac9d1fc760cfa557be574ba070963965f2e21ef0ef51eb483218', '2d44d26dde157d9a297f13de728c6c69cc0c964700d50eaf76eafa755b519ee0'],
    [338370, '21/7865', '39ceb98ec11eaa7ae80be06864f4f6eeb7606cc9e4d451039680c6cc893f4220', '4bb35bd98ca0003e709d03b861748463e12c4431ad1297206a229ac39f713156'],
    [338371, '21/7866', 'f267156a7bb57bf5585c710134231e1ff297aab4ed22e754b7ec8d3ded04a555', '3a6983d20d2e31732a98162324f1d3e4ad3dada54be65c72ec780ec2eb722170'],
  ]
  for (const [id, drucksache, hash, translationHash] of reviews) {
    const output = applyReviewedFields(id, 'de', drucksache, hash, {
      summary_simplified: 'arbitrary',
      summary_detail: 'arbitrary',
    })
    assert.notEqual(output.summary_simplified, 'arbitrary')
    assert.notEqual(output.summary_detail, 'arbitrary')
    assert.equal(antragDescriptionSourceHash(output.summary_simplified, output.summary_detail), translationHash)
    assert.doesNotThrow(() => assertReviewedFields(id, 'de', germanDescriptionReviewForHash(id, drucksache, hash), output))
  }
})

test('September 5 reviews preserve every corrected condition and reject every superseded phrase', () => {
  const reviews = [
    [334474, 'de', '21/6581', 'b39ee2e6eeb52a90c967926c4da15c39b834e1e8edd5c2f0fef3da4924a506a2'],
    [334474, 'en', '21/6581', 'e94343cfbdbc836669ef01784e663c6f102a81189db5b28e9a80c62a61a5f812'],
    [334557, 'de', '21/6806', '2d64793986645e073a64b031f15aa38def44fdf476e6c86879bf12dfaaa066e3'],
    [334557, 'en', '21/6806', '62a6cf1e6fa7beeef0c41a2097e0cd18aac55e0fa7eb214e769dc4bc9f443bbe'],
    [334922, 'de', '21/6279', '9a5e0284c3f8e68a26e95f0c279cd0be2bc2ca96e2eb9b3f51b0ec16e1a67ffc'],
    [334922, 'en', '21/6279', '12c2310e8f1b8ea5812defd595125e58f97958a4d4ef7c6d43ef741eb03c598f'],
    [335448, 'de', '21/7403', '324c586bccc7f1bfc8bbaefcd7131c9dd3e2f0d461dd266d8f6c904291522fe4'],
    [335448, 'en', '21/7403', '52cd61e9956819edc42fd8d9c7d76d085e7782d8e3481c40f299d82745df2216'],
    [335462, 'de', '21/6587', '429b35c97683f7dec0564f31a7bc84d37782d5f3efd384c9e69d8fdd3c745c29'],
    [335462, 'en', '21/6587', '1ebcbe0eb5ceab9e34b42834283647f849615bbd233b455e7b6ba1526d923a4d'],
    [335466, 'de', '21/7820', 'a144f2568c0e7a35b4f29d3d866e366151147c679811ad2302737f357dc2763b'],
    [335466, 'en', '21/7820', '5cafb33efb9d17b61cf0eb4595c344ee94ff89b2a9b373bbca6152d4f37c8b4c'],
    [335476, 'de', '21/6585', 'a0d7776bfff296484dbc6f7e3241906bcd247938a1d42c267ce797cc9e481d5d'],
    [335476, 'en', '21/6585', '3f7e71e7389e59b8e64d6603db2ec8b9893ab55dcfbc5266e1a697f951a25e65'],
    [335477, 'en', '21/6586', '14ba034d5665434a06fbf3fbd0119ec20cc3e97025621f33ef477525d276cc19'],
    [335555, 'de', '21/7195', '96f641016600c41deb28bf2ffed0746ca4ae230e2028c31b9f791cedefe7c977'],
    [335555, 'en', '21/7195', 'd42494c8e56b36f79a7fe16d9f59f3dfc5c7464bce7558ed7be0e022148ffe18'],
  ]
  for (const [id, locale, drucksache, hash] of reviews) {
    const review = locale === 'de' ? germanDescriptionReviewForHash(id, drucksache, hash) : englishDescriptionReview(id, drucksache)
    const output = applyReviewedFields(id, locale, drucksache, hash, {
      summary_simplified: 'arbitrary',
      summary_detail: 'arbitrary',
    })
    assert.doesNotThrow(() => assertReviewedFields(id, locale, review, output))
    for (const [field, requirements] of Object.entries(review)) {
      for (const required of requirements.required ?? []) {
        assert.equal(output[field].includes(required), true, `${id} ${locale} ${field} missing ${required}`)
      }
      for (const forbidden of requirements.forbidden ?? []) {
        assert.equal(output[field].includes(forbidden), false, `${id} ${locale} ${field} retains ${forbidden}`)
        assert.throws(
          () => assertReviewedFields(id, locale, review, { ...output, [field]: `${output[field]} ${forbidden}` }),
          /retains forbidden text/,
        )
      }
    }
  }
  assert.equal(
    applyReviewedTitleFields(334554, 'en', '21/6509', '0ebbfc4ae74fb50b99684977feeefdc7541a6d2d021f08f361d3ba0549aefbd3', { clean_title: 'Enable digital swearing-in of experts and public officials' }).clean_title,
    'Enable digital formal obligations for experts and public authority staff',
  )
  assert.throws(
    () => applyReviewedTitleFields(334554, 'en', '21/6509', 'changed', { clean_title: 'arbitrary' }),
    /title input hash mismatch/,
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

test('September 12 Portuguese repayment title is source-bound', () => {
  assert.equal(
    reviewedGermanTitle(338869, '21/7910', 'd51bcaf7b334924d7da2037528c9f1eab8b8808e3c83d2e9bbe5c4751e9cb6f3', 'Portugals EFSM-Kreditrückzahlung'),
    'Portugals vorzeitige EFSM-Teilrückzahlung bis Ende 2027 ermöglichen',
  )
  assert.equal(hasReviewedGermanTitle(338869, '21/7910', 'd51bcaf7b334924d7da2037528c9f1eab8b8808e3c83d2e9bbe5c4751e9cb6f3'), true)
  assert.throws(() => reviewedGermanTitle(338869, '21/7910', 'changed', 'Generated'), /de title input hash mismatch/)
  assert.throws(() => reviewedGermanTitle(338869, '21/7911', 'd51bcaf7b334924d7da2037528c9f1eab8b8808e3c83d2e9bbe5c4751e9cb6f3', 'Generated'), /Drucksache mismatch/)
})

test('September 12 offshore wind English title is source-bound', () => {
  assert.equal(
    reviewedEnglishTitle(338788, '508/26', 'dc8f5cb2ed9f3c0e805ff14f320dcbf50dfdb7136139e4b147961781779b4411', 'Coordinate offshore wind energy with power grids and provide state guarantees'),
    'Coordinate offshore wind energy with power grids and provide government backing',
  )
  assert.throws(() => reviewedEnglishTitle(338788, '508/26', 'changed', 'Generated'), /en title input hash mismatch/)
  assert.throws(() => reviewedEnglishTitle(338788, '509/26', 'dc8f5cb2ed9f3c0e805ff14f320dcbf50dfdb7136139e4b147961781779b4411', 'Generated'), /Drucksache mismatch/)
})

test('reviewed requirements are appended after source truncation', () => {
  const required = 'Diese geprüfte Einschränkung liegt hinter dem abgeschnittenen Quelltext.'
  const prompt = buildPrompt('Titel', 'x'.repeat(40000), 'antrag', { summary_detail: { required: [required] } })
  assert.equal(prompt.includes('x'.repeat(30001)), false)
  assert.equal(prompt.includes(required), true)
  assert.equal(prompt.indexOf(required) > prompt.lastIndexOf('x'.repeat(100)), true)
})
