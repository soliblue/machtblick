import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PREPROCESSING_MODEL, PREPROCESSING_REASONING_EFFORT } from './config.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const etlRoot = join(root, 'etl', 'bundestag')
const failures = []

if (PREPROCESSING_MODEL !== 'gpt-5.6-sol') failures.push(`unexpected preprocessing model ${PREPROCESSING_MODEL}`)
if (PREPROCESSING_REASONING_EFFORT !== 'high') failures.push(`unexpected preprocessing reasoning ${PREPROCESSING_REASONING_EFFORT}`)

const legacyNeedles = [
  ['cla', 'ude'].join(''),
  ['son', 'net'].join(''),
  ['hai', 'ku'].join(''),
  ['CODEX', 'MODEL'].join('_'),
  ['CLAUDE', 'MODEL'].join('_'),
  ['DESCRIPTION', 'PROVIDER'].join('_'),
  ['TRANSLATION', 'PROVIDER'].join('_'),
  ['POLARITY', 'PROVIDER'].join('_'),
  ['TITLE', 'PROVIDER'].join('_'),
  ['gpt', '5.4'].join('-'),
  ['gpt', '5.5'].join('-'),
  ['model_reasoning_effort', '"low"'].join('='),
]

const quote = "'"
const directCodex = new RegExp(`spawn\\(${quote}${['cod', 'ex'].join('')}${quote}`)
const directExternal = new RegExp([
  `spawn\\(${quote}${['cla', 'ude'].join('')}${quote}`,
  `execFileSync\\(${quote}${['cla', 'ude'].join('')}${quote}`,
].join('|'))
const mjsFiles = walk(etlRoot).filter((file) => file.endsWith('.mjs'))
for (const file of mjsFiles) {
  const rel = relative(root, file)
  const text = readFileSync(file, 'utf8')
  if (rel !== 'etl/bundestag/preprocessing/codex.mjs' && directCodex.test(text)) failures.push(`${rel} spawns codex directly`)
  if (directExternal.test(text)) failures.push(`${rel} spawns legacy external model directly`)
  if (!rel.startsWith('etl/bundestag/preprocessing/')) {
    for (const needle of legacyNeedles) {
      if (text.includes(needle)) failures.push(`${rel} contains legacy selector ${needle}`)
    }
  }
}

for (const file of walk(etlRoot).filter((name) => name.endsWith('.json') && !name.includes('/handzeichen/drucksachen/'))) {
  const json = JSON.parse(readFileSync(file, 'utf8'))
  if (file.endsWith('-schema.json') || file.endsWith('/output-schema.json') || file.endsWith('/output-schema-batch.json')) validateSchema(file, json)
}

for (const [file, fields] of Object.entries({
  'db/schema/voteDescriptionDecisions.ts': ['modelReasoningEffort'],
  'db/schema/antragDescriptions.ts': ['modelReasoningEffort', 'titleModelReasoningEffort'],
  'db/schema/votePartySummaryDecisions.ts': ['modelReasoningEffort'],
  'db/schema/voteTranslations.ts': ['modelReasoningEffort'],
  'db/schema/votePartySummaryTranslations.ts': ['modelReasoningEffort'],
  'db/schema/speechTranslations.ts': ['modelReasoningEffort'],
})) {
  const text = readFileSync(join(root, file), 'utf8')
  for (const field of fields) {
    if (!text.includes(field)) failures.push(`${file} missing ${field}`)
  }
}

const migration = readFileSync(join(root, 'db/migrations/0029_preprocessing_model_provenance.sql'), 'utf8')
for (const column of ['model_reasoning_effort', 'title_model_reasoning_effort']) {
  if (!migration.includes(column)) failures.push(`0029 migration missing ${column}`)
}

if (failures.length) {
  for (const failure of failures) console.error(failure)
  process.exit(1)
}

console.log(`preprocessing model=${PREPROCESSING_MODEL} reasoning=${PREPROCESSING_REASONING_EFFORT}`)
console.log(`checked ${mjsFiles.length} Bundestag ETL scripts`)

function walk(dir) {
  const entries = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (path.includes('/handzeichen/drucksachen/')) continue
    if (path.includes('/descriptions/pdf/') || path.includes('/descriptions/text/') || path.includes('/descriptions/dip-cache/')) continue
    const s = statSync(path)
    if (s.isDirectory()) entries.push(...walk(path))
    else entries.push(path)
  }
  return entries
}

function validateSchema(file, value) {
  if (value?.type === 'object') {
    if (value.additionalProperties !== false) failures.push(`${relative(root, file)} permits additional properties`)
    const propertyNames = Object.keys(value.properties ?? {})
    const required = new Set(value.required ?? [])
    for (const name of propertyNames) {
      if (!required.has(name)) failures.push(`${relative(root, file)} does not require ${name}`)
      validateSchema(file, value.properties[name])
    }
  }
  if (value?.type === 'array') validateSchema(file, value.items)
}
