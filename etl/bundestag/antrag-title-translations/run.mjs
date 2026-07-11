import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { runPreprocessingCodex } from '../preprocessing/codex.mjs'
import { PREPROCESSING_MODEL, PREPROCESSING_REASONING_EFFORT } from '../preprocessing/config.mjs'
import { ensureTextColumn } from '../preprocessing/schema.mjs'

const PROMPT_VERSION = 'antrag-title-translation-en-v1'
const promptTemplate = readFileSync(fileURLToPath(new URL('../../../prompts/etl/bundestag/antrag-title-translations.md', import.meta.url)), 'utf8').trimEnd()
const schemaPath = fileURLToPath(new URL('./output-schema.json', import.meta.url))
const timeoutMs = Number(process.env.CODEX_TIMEOUT_MS ?? 240000)
const concurrency = Number(argValue('--concurrency') ?? 3)
const batchSize = Number(argValue('--batch-size') ?? 20)
const limit = Number(argValue('--limit') ?? 0)
const antragFilter = argValue('--antrag')
const force = process.argv.includes('--force')
const dryRun = process.argv.includes('--dry-run')
const dbPath = process.env.MACHTBLICK_DB ?? findDbPath()
const db = new Database(dbPath)

ensureSchema()

const candidates = db.prepare(`
  SELECT a.id, a.title, a.clean_title, t.title_source_hash
  FROM antrag_description_translations t
  INNER JOIN antraege a ON a.id = t.antrag_id
  WHERE t.locale = 'en'
    AND a.wahlperiode = 21
    AND (? IS NULL OR a.id = ?)
  ORDER BY a.introduced_date DESC, a.id DESC
`).all(antragFilter ?? null, antragFilter ?? null)

const jobs = candidates
  .map((row) => ({ row, hash: sourceHash(row.title, row.clean_title) }))
  .filter((job) => force || job.row.title_source_hash !== job.hash)

const selected = limit > 0 ? jobs.slice(0, limit) : jobs
const batches = chunk(selected, batchSize)
console.log(`antrag title translation jobs: ${selected.length}/${candidates.length} eligible, batches=${batches.length}, batchSize=${batchSize}, db=${dbPath}, model=${PREPROCESSING_MODEL}, reasoning=${PREPROCESSING_REASONING_EFFORT}`)
if (dryRun) {
  db.close()
  process.exit(0)
}

let cursor = 0
let completed = 0
let failed = 0

const workers = Array.from({ length: Math.min(concurrency, batches.length) }, async () => {
  while (cursor < batches.length) {
    const batch = batches[cursor]
    cursor++
    try {
      const output = await runPreprocessingCodex({
        prompt: buildPrompt(batch.map((job) => job.row)),
        schemaPath,
        timeoutMs,
        tmpPrefix: 'machtblick-antrag-title-translation-',
      })
      writeBatch(batch, output)
      completed += batch.length
      console.log(batch.map((job) => job.row.id).join(', '))
    } catch (e) {
      failed += batch.length
      console.warn(`x batch failed: ${e.message}`)
    }
  }
})

await Promise.all(workers)
console.log(`done. completed=${completed} failed=${failed}`)
db.close()
if (failed > 0) process.exit(1)

function argValue(name) {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : null
}

function findDbPath() {
  const sourceAdjacent = fileURLToPath(new URL('../../../db/machtblick.sqlite', import.meta.url))
  if (existsSync(sourceAdjacent)) return sourceAdjacent
  let dir = process.cwd()
  while (true) {
    const candidate = join(dir, 'db', 'machtblick.sqlite')
    if (existsSync(candidate)) return candidate
    const parent = dirname(dir)
    if (parent === dir) return sourceAdjacent
    dir = parent
  }
}

function ensureSchema() {
  const columns = db.prepare('PRAGMA table_info(antrag_description_translations)').all().map((c) => c.name)
  for (const column of ['title', 'clean_title', 'title_source_hash', 'title_model', 'title_model_reasoning_effort', 'title_prompt_version']) {
    if (!columns.includes(column)) ensureTextColumn(db, 'antrag_description_translations', column)
  }
}

function sourceHash(title, cleanTitle) {
  return createHash('sha256').update(JSON.stringify({ title, cleanTitle })).digest('hex')
}

function chunk(items, size) {
  const chunks = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

function buildPrompt(rows) {
  return promptTemplate.replace('__INPUT_JSON__', JSON.stringify({ rows: rows.map((r) => ({ antrag_id: r.id, title: r.title, clean_title: r.clean_title })) }, null, 2)) + '\n'
}

function writeBatch(batch, output) {
  const byId = new Map(output.translations.map((t) => [t.antrag_id, t]))
  const now = new Date().toISOString()
  const update = db.prepare(`
    UPDATE antrag_description_translations
    SET title = ?, clean_title = ?, title_source_hash = ?, title_model = ?, title_model_reasoning_effort = ?, title_prompt_version = ?, translated_at = ?
    WHERE antrag_id = ? AND locale = 'en'
  `)
  for (const job of batch) {
    const translated = byId.get(job.row.id)
    if (!translated) throw new Error(`missing title translation for ${job.row.id}`)
    const title = clean(translated.title)
    if (!title) throw new Error(`empty title translation for ${job.row.id}`)
    update.run(title, job.row.clean_title ? clean(translated.clean_title) : null, job.hash, PREPROCESSING_MODEL, PREPROCESSING_REASONING_EFFORT, PROMPT_VERSION, now, job.row.id)
  }
}

function clean(value) {
  const text = String(value ?? '')
    .replaceAll('\u2014', ', ')
    .replaceAll('\u2013', '-')
    .replace(/\s+/g, ' ')
    .trim()
  return text || null
}
