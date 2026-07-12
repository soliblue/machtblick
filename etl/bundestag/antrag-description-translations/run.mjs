import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { argValue, chunk, findDbPath, normalizeDashes } from '../../_shared/worker.mjs'
import { buildPrompt, PROMPT_VERSION } from './prompt.mjs'
import { runPreprocessingCodex } from '../preprocessing/codex.mjs'
import { PREPROCESSING_MODEL, PREPROCESSING_REASONING_EFFORT } from '../preprocessing/config.mjs'
import { ensureTextColumn } from '../preprocessing/schema.mjs'

const schemaPath = fileURLToPath(new URL('./output-schema.json', import.meta.url))
const timeoutMs = Number(process.env.CODEX_TIMEOUT_MS ?? 180000)
const concurrency = Number(argValue('--concurrency') ?? 2)
const batchSize = Number(argValue('--batch-size') ?? 8)
const limit = Number(argValue('--limit') ?? 0)
const antragFilter = argValue('--antrag')
const force = process.argv.includes('--force')
const dbPath = process.env.MACHTBLICK_DB ?? findDbPath()
const db = new Database(dbPath)

ensureSchema()

const candidates = db.prepare(`
  SELECT ad.antrag_id, a.title, ad.summary_simplified, ad.summary_detail
  FROM antrag_descriptions ad
  INNER JOIN antraege a ON a.id = ad.antrag_id
  LEFT JOIN antrag_description_translations t
    ON t.antrag_id = ad.antrag_id AND t.locale = 'en'
  WHERE a.wahlperiode = 21
    AND ad.summary_simplified IS NOT NULL
    AND ad.summary_detail IS NOT NULL
    AND (? IS NULL OR ad.antrag_id = ?)
`).all(antragFilter ?? null, antragFilter ?? null)

const jobs = candidates
  .map((row) => ({ row, hash: sourceHash(row.summary_simplified, row.summary_detail) }))
  .filter((job) => force || stale(job.row.antrag_id, job.hash))

const selected = limit > 0 ? jobs.slice(0, limit) : jobs
const batches = chunk(selected, batchSize)
console.log(`antrag translation jobs: ${selected.length}/${jobs.length} eligible, batches=${batches.length}, batchSize=${batchSize}, db=${dbPath}, model=${PREPROCESSING_MODEL}, reasoning=${PREPROCESSING_REASONING_EFFORT}`)

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
        tmpPrefix: 'machtblick-antrag-translation-',
      })
      writeBatch(batch, output)
      completed += batch.length
      console.log(batch.map((job) => job.row.antrag_id).join(', '))
    } catch (e) {
      failed += batch.length
      console.warn(`x batch failed: ${e.message}`)
    }
  }
})

await Promise.all(workers)
console.log(`done. completed=${completed} failed=${failed}`)
db.close()

function ensureSchema() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS antrag_description_translations (
      antrag_id integer NOT NULL,
      locale text NOT NULL,
      summary_simplified text,
      summary_detail text,
      source_hash text,
      model text,
      model_reasoning_effort text,
      prompt_version text,
      translated_at text,
      PRIMARY KEY(antrag_id, locale),
      FOREIGN KEY (antrag_id) REFERENCES antraege(id)
    )
  `).run()
  ensureTextColumn(db, 'antrag_description_translations', 'model_reasoning_effort')
}

function sourceHash(summarySimplified, summaryDetail) {
  return createHash('sha256').update(JSON.stringify({ summarySimplified, summaryDetail })).digest('hex')
}

function stale(antragId, hash) {
  const row = db.prepare('SELECT source_hash FROM antrag_description_translations WHERE antrag_id = ? AND locale = ?').get(antragId, 'en')
  return row?.source_hash !== hash
}

function writeBatch(batch, output) {
  const byId = new Map(output.translations.map((t) => [t.antrag_id, t]))
  const now = new Date().toISOString()
  for (const job of batch) {
    const translated = byId.get(job.row.antrag_id)
    if (!translated) throw new Error(`missing Antrag translation for ${job.row.antrag_id}`)
    db.prepare(`
      INSERT INTO antrag_description_translations (
        antrag_id, locale, summary_simplified, summary_detail, source_hash, model, model_reasoning_effort, prompt_version, translated_at
      ) VALUES (?, 'en', ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(antrag_id, locale) DO UPDATE SET
        summary_simplified = excluded.summary_simplified,
        summary_detail = excluded.summary_detail,
        source_hash = excluded.source_hash,
        model = excluded.model,
        model_reasoning_effort = excluded.model_reasoning_effort,
        prompt_version = excluded.prompt_version,
        translated_at = excluded.translated_at
    `).run(
      job.row.antrag_id,
      normalizeDashes(translated.summary_simplified),
      normalizeDashes(translated.summary_detail),
      job.hash,
      PREPROCESSING_MODEL,
      PREPROCESSING_REASONING_EFFORT,
      PROMPT_VERSION,
      now,
    )
  }
}

