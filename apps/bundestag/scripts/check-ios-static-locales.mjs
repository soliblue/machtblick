import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = resolve(app, '../..')
const publicDirectory = resolve(app, 'public')
const distDirectory = resolve(app, 'dist/client')
const categories = ['api', 'votes', 'members', 'motions', 'parties']
const stableFields = new Set([
  'id',
  'ids',
  'voteId',
  'memberId',
  'speakerMemberId',
  'antragId',
  'party',
  'result',
  'choice',
  'position',
  'voteType',
  'date',
  'drucksache',
  'mandateType',
  'sex',
  'state',
  'termNumber',
  'contributionType',
  'debateGroupId',
])
const expected = new Map()
const database = new Database(resolve(root, 'db/machtblick.sqlite'), { readonly: true })
expected.set(
  'votes',
  database.prepare(
    "SELECT count(*) AS count FROM votes WHERE term_id = 21 AND procedural = 0 AND vote_type != 'hammelsprung'",
  ).get().count,
)
expected.set('members', database.prepare(`
  SELECT count(DISTINCT m.id) AS count
  FROM members m
  INNER JOIN vote_members vm ON vm.member_id = m.id
  INNER JOIN votes v ON v.id = vm.vote_id
  WHERE v.term_id = 21
`).get().count)
expected.set('motions', database.prepare(`
  SELECT count(*) AS count
  FROM antraege a
  INNER JOIN antrag_descriptions ad ON ad.antrag_id = a.id
  WHERE a.wahlperiode = 21
`).get().count)
expected.set('parties', database.prepare(`
  SELECT count(DISTINCT s.party) AS count
  FROM vote_party_summaries s
  INNER JOIN votes v ON v.id = s.vote_id
  WHERE v.term_id = 21 AND v.vote_type = 'namentlich'
`).get().count)
database.close()

const jsonFiles = (directory) =>
  readdirSync(directory).filter((file) => file.endsWith('.json')).sort()

const sameShape = (german, english, location) => {
  if (Array.isArray(german) || Array.isArray(english)) {
    if (!Array.isArray(german) || !Array.isArray(english) || german.length !== english.length) {
      throw new Error(`Array mismatch at ${location}`)
    }
    for (let index = 0; index < german.length; index++) {
      sameShape(german[index], english[index], `${location}[${index}]`)
    }
  } else if (german === null || english === null) {
    if (german !== null || english !== null) {
      throw new Error(`Value shape mismatch at ${location}`)
    }
  } else if (typeof german === 'object' && typeof english === 'object') {
    const germanKeys = Object.keys(german).sort()
    const englishKeys = Object.keys(english).sort()
    if (JSON.stringify(germanKeys) !== JSON.stringify(englishKeys)) {
      throw new Error(`Key mismatch at ${location}`)
    }
    for (const key of germanKeys) sameShape(german[key], english[key], `${location}.${key}`)
  } else if (typeof german !== typeof english) {
    throw new Error(`Value shape mismatch at ${location}`)
  }
}

const sameStableFields = (german, english, location, key = '') => {
  if (stableFields.has(key) && JSON.stringify(german) !== JSON.stringify(english)) {
    throw new Error(`Stable field mismatch at ${location}`)
  }
  if (Array.isArray(german)) {
    for (let index = 0; index < german.length; index++) {
      sameStableFields(german[index], english[index], `${location}[${index}]`)
    }
  } else if (german && typeof german === 'object') {
    for (const child of Object.keys(german)) {
      sameStableFields(german[child], english[child], `${location}.${child}`, child)
    }
  }
}

const sameStableMemberData = (german, english, file) => {
  if ('initiatives' in german || 'initiatives' in english) {
    throw new Error(`Initiatives remain in ${file}`)
  }
  if (!('education' in german) || !('education' in english)) {
    throw new Error(`Education missing in ${file}`)
  }
  for (const key of [
    'id',
    'party',
    'state',
    'yearOfBirth',
    'sex',
    'mandateType',
    'listState',
    'constituencyNumber',
  ]) {
    if (german[key] !== english[key]) {
      throw new Error(`Stable member field mismatch at ${file}.${key}`)
    }
  }
  for (let index = 0; index < german.history.length; index++) {
    const left = german.history[index]
    const right = english.history[index]
    for (const entry of [left, right]) {
      if (!Object.hasOwn(entry, 'proposingParty')) {
        throw new Error(`Proposing party missing at ${file}.history[${index}]`)
      }
      if (!Array.isArray(entry.partySummaries) || !entry.partySummaries.length) {
        throw new Error(`Party summaries missing at ${file}.history[${index}]`)
      }
      if (
        entry.partyMajority
        && !entry.partySummaries.some((summary) => summary.party === entry.party)
      ) {
        throw new Error(`Member party summary missing at ${file}.history[${index}]`)
      }
      for (const summary of entry.partySummaries) {
        if (
          typeof summary.party !== 'string'
          || !['yes', 'no', 'abstain', 'mixed', 'split'].includes(summary.position)
          || !['members', 'yes', 'no', 'abstain', 'absent'].every(
            (key) => Number.isInteger(summary[key]),
          )
        ) {
          throw new Error(`Invalid party summary at ${file}.history[${index}]`)
        }
      }
    }
    for (const key of [
      'voteId',
      'result',
      'choice',
      'party',
      'partyMajority',
      'defected',
      'proposingParty',
    ]) {
      if (left[key] !== right[key]) {
        throw new Error(`Stable member field mismatch at ${file}.history[${index}].${key}`)
      }
    }
    if (JSON.stringify(left.partySummaries) !== JSON.stringify(right.partySummaries)) {
      throw new Error(`Party summaries mismatch at ${file}.history[${index}]`)
    }
  }
  for (let index = 0; index < german.speeches.length; index++) {
    for (const key of [
      'id',
      'speakerMemberId',
      'party',
      'position',
      'date',
      'debateGroupId',
      'contributionType',
      'voteId',
    ]) {
      if (german.speeches[index][key] !== english.speeches[index][key]) {
        throw new Error(`Stable member speech mismatch at ${file}.speeches[${index}].${key}`)
      }
    }
  }
}

let artifactCount = 0
for (const category of categories) {
  const germanDirectory = resolve(publicDirectory, category)
  const englishDirectory = resolve(publicDirectory, 'en', category)
  const germanFiles = jsonFiles(germanDirectory)
  const englishFiles = jsonFiles(englishDirectory)
  if (JSON.stringify(germanFiles) !== JSON.stringify(englishFiles)) {
    throw new Error(`File mismatch in ${category}`)
  }
  if (expected.has(category) && germanFiles.length !== expected.get(category)) {
    throw new Error(
      `${category} has ${germanFiles.length} files, expected ${expected.get(category)}`,
    )
  }
  for (const file of germanFiles) {
    const german = JSON.parse(readFileSync(resolve(germanDirectory, file), 'utf8'))
    const english = JSON.parse(readFileSync(resolve(englishDirectory, file), 'utf8'))
    sameShape(german, english, `${category}/${file}`)
    sameStableFields(german, english, `${category}/${file}`)
    if (category === 'members') sameStableMemberData(german, english, file)
    artifactCount += 1
  }
}

for (const file of [
  'speeches-meta.json',
  'speeches-people.json',
  'speeches-search-0.json',
  'speeches-search-1.json',
  'speeches-search-2.json',
  'speeches-search-3.json',
]) {
  const german = JSON.parse(readFileSync(resolve(publicDirectory, file), 'utf8'))
  const english = JSON.parse(readFileSync(resolve(publicDirectory, 'en', file), 'utf8'))
  sameShape(german, english, file)
  sameStableFields(german, english, file)
  artifactCount += 1
}

for (const category of ['votes', 'members', 'parties', 'motions']) {
  const file = jsonFiles(resolve(publicDirectory, 'en', category))[0]
  const id = file.replace(/\.json$/, '')
  const html = readFileSync(resolve(distDirectory, 'en', category, id, 'index.html'), 'utf8')
  if (!html.includes(`rel="alternate" type="application/json" href="/en/${category}/${file}"`)) {
    throw new Error(`English JSON alternate missing for ${category}/${id}`)
  }
}

const englishMemberHtml = readFileSync(
  resolve(
    distDirectory,
    'en/members',
    jsonFiles(resolve(publicDirectory, 'en/members'))[0].replace(/\.json$/, ''),
    'index.html',
  ),
  'utf8',
)
if (
  englishMemberHtml.includes('voting records, speeches, and motions')
  || !englishMemberHtml.includes('https://machtblick.de/en/api/members.json')
) {
  throw new Error('Bilingual member DataCatalog metadata is stale')
}

const apiCatalog = JSON.parse(
  readFileSync(resolve(distDirectory, '.well-known/api-catalog'), 'utf8'),
)
const catalogPaths = new Set(
  apiCatalog.linkset.flatMap((linkset) => linkset['service-desc'] ?? []).map((entry) => entry.href),
)
for (const path of [
  '/en/api/votes.json',
  '/en/api/members.json',
  '/en/api/parties.json',
  '/en/api/motions.json',
  '/en/speeches-meta.json',
  '/en/speeches-people.json',
  '/en/speeches-search-0.json',
  '/en/speeches-search-1.json',
  '/en/speeches-search-2.json',
  '/en/speeches-search-3.json',
]) {
  if (!catalogPaths.has(path)) throw new Error(`API catalog missing ${path}`)
}

const llms = readFileSync(resolve(distDirectory, 'llms.txt'), 'utf8')
for (const path of [
  '/en/api/votes.json',
  '/en/votes/{id}.json',
  '/en/members/{slug}.json',
  '/en/parties/{slug}.json',
  '/en/speeches-meta.json',
  '/en/speeches-search-{0..3}.json',
]) {
  if (!llms.includes(path)) throw new Error(`llms.txt missing ${path}`)
}

console.log(
  `${artifactCount} German and English iOS static artifacts have matching schemas, stable identifiers, complete member vote enrichment, and discoverable English endpoints.`,
)
