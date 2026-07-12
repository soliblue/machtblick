import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { argValue, findDbPath } from '../../_shared/worker.mjs'
import { pLimit } from '../polarity/limit.mjs'
import { buildPrompt, PROMPT_VERSION } from './prompt.mjs'
import { runPreprocessingCodex } from '../preprocessing/codex.mjs'
import { PREPROCESSING_MODEL, PREPROCESSING_REASONING_EFFORT } from '../preprocessing/config.mjs'

const schemaPath = fileURLToPath(new URL('./output-schema.json', import.meta.url))
const timeoutMs = Number(process.env.CODEX_TIMEOUT_MS ?? 240000)
const batchSize = Number(argValue('--batch-size') ?? 40)
const concurrency = Number(argValue('--concurrency') ?? 2)
const rowLimit = Number(argValue('--limit') ?? 0)
const antragFilter = argValue('--antrag')
const force = process.argv.includes('--force')
const dryRun = process.argv.includes('--dry-run')
const dbPath = process.env.MACHTBLICK_DB ?? findDbPath()
const db = new Database(dbPath)

ensureSchema()

const rows = db.prepare(`
  SELECT a.id, a.type, a.title, ad.summary_simplified AS summary
  FROM antraege a
  INNER JOIN antrag_descriptions ad ON ad.antrag_id = a.id
  WHERE a.wahlperiode = 21
    AND ad.summary_simplified IS NOT NULL
    AND (? IS NULL OR a.id = ?)
    AND (? = 1 OR a.clean_title IS NULL)
  ORDER BY a.introduced_date DESC, a.id DESC
`).all(antragFilter ?? null, antragFilter ?? null, force ? 1 : 0)

const selected = rowLimit > 0 ? rows.slice(0, rowLimit) : rows
const batches = []
for (let i = 0; i < selected.length; i += batchSize) batches.push(selected.slice(i, i + batchSize))

console.log(`antrag title jobs: ${selected.length}/${rows.length} rows, ${batches.length} batches, db=${dbPath}, model=${PREPROCESSING_MODEL}, reasoning=${PREPROCESSING_REASONING_EFFORT}`)

const update = db.prepare('UPDATE antraege SET clean_title = ? WHERE id = ?')
const limit = pLimit(concurrency)
let written = 0
let nulled = 0
let low = 0

await Promise.all(batches.map((batch, index) =>
  limit(async () => {
    const items = batch.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      summary: row.summary,
    }))
    const output = await runPreprocessingCodex({
      prompt: buildPrompt(items),
      schemaPath,
      timeoutMs,
      tmpPrefix: 'machtblick-antrag-title-codex-',
    })
    writeOutput(output)
    console.log(`batch ${index + 1}/${batches.length}`)
  }),
))

console.log(`done. written=${written} kept_original=${nulled} low_skipped=${low}${dryRun ? ' dry_run=1' : ''}`)
db.close()

function writeOutput(output) {
  for (const item of output.items) {
    const cleanTitle = cleanText(item.clean_title)
    if (item.confidence === 'low') {
      low++
    } else if (!cleanTitle) {
      nulled++
    } else {
      if (!dryRun) update.run(cleanTitle, item.id)
      written++
    }
  }
}

function ensureSchema() {
  const columns = db.prepare('PRAGMA table_info(antraege)').all()
  const hasCleanTitle = columns.some((column) => column.name === 'clean_title')
  if (!hasCleanTitle) db.prepare('ALTER TABLE antraege ADD COLUMN clean_title text').run()
}

function cleanText(value) {
  const text = String(value ?? '')
    .replaceAll('\u2014', ', ')
    .replaceAll('\u2013', '-')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > 100 ? `${text.slice(0, 97).trim()}...` : text || null
}
