import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { argValue, findDbPath, sourceHash, trimOrNull } from '../../_shared/worker.mjs'
import { buildPrompt, PROMPT_VERSION } from './prompt.mjs'
import { runPreprocessingCodex } from '../preprocessing/codex.mjs'
import { PREPROCESSING_MODEL, PREPROCESSING_REASONING_EFFORT } from '../preprocessing/config.mjs'
import { ensureTextColumn } from '../preprocessing/schema.mjs'

const schemaPath = fileURLToPath(new URL('./output-schema.json', import.meta.url))
const concurrency = Number(argValue('--concurrency') ?? 2)
const maxWords = Number(argValue('--max-words') ?? 2200)
const maxItems = Number(argValue('--max-items') ?? 8)
const limit = Number(argValue('--limit') ?? 0)
const voteFilter = argValue('--vote')
const force = process.argv.includes('--force')
const dbPath = process.env.MACHTBLICK_DB ?? findDbPath()
const db = new Database(dbPath)

ensureSchema()

const rows = db.prepare(`
  SELECT s.id, s.vote_id, s.speaker_name, s.speaker_role, s.party, s.text_full, s.word_count
  FROM speeches s
  INNER JOIN votes v ON v.id = s.vote_id
  WHERE s.vote_id IS NOT NULL
    AND v.procedural = 0
    AND v.vote_type != 'hammelsprung'
    AND (? IS NULL OR s.vote_id = ?)
  ORDER BY s.date DESC, s.position ASC
`).all(voteFilter ?? null, voteFilter ?? null)

const existing = new Map(
  db.prepare('SELECT speech_id, source_hash FROM speech_translations WHERE locale = ?').all('en').map((r) => [r.speech_id, r.source_hash]),
)

const jobs = rows
  .map((row) => ({ row, sourceHash: sourceHash({ text_full: row.text_full }) }))
  .filter((job) => force || existing.get(job.row.id) !== job.sourceHash)

const selected = limit > 0 ? jobs.slice(0, limit) : jobs
const batches = batchJobs(selected, maxWords, maxItems)
console.log(`speech translation jobs: ${selected.length}/${jobs.length} eligible, batches=${batches.length}, maxWords=${maxWords}, maxItems=${maxItems}, db=${dbPath}, model=${PREPROCESSING_MODEL}, reasoning=${PREPROCESSING_REASONING_EFFORT}`)

let cursor = 0
const workers = Array.from({ length: Math.min(concurrency, batches.length) }, async () => {
  while (cursor < batches.length) {
    const batch = batches[cursor]
    cursor++
    const output = await runPreprocessingCodex({
      prompt: buildPrompt({
        speeches: batch.map(({ row }) => ({
          speech_id: row.id,
          speaker_name: row.speaker_name,
          speaker_role: row.speaker_role,
          party: row.party,
          text_full: row.text_full,
        })),
      }),
      schemaPath,
      tmpPrefix: 'machtblick-speech-translation-',
    })
    writeBatch(batch, output)
    console.log(batch.map(({ row }) => row.id).join(', '))
  }
})

await Promise.all(workers)
db.close()

function batchJobs(items, words, maxCount) {
  const batches = []
  let batch = []
  let wordCount = 0
  for (const item of items) {
    const nextWords = item.row.word_count ?? countWords(item.row.text_full)
    if (batch.length && (batch.length >= maxCount || wordCount + nextWords > words)) {
      batches.push(batch)
      batch = []
      wordCount = 0
    }
    batch.push(item)
    wordCount += nextWords
  }
  if (batch.length) batches.push(batch)
  return batches
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function ensureSchema() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS speech_translations (
      speech_id text NOT NULL,
      locale text NOT NULL,
      text_excerpt text NOT NULL,
      text_full text NOT NULL,
      source_hash text NOT NULL,
      model text NOT NULL,
      model_reasoning_effort text,
      prompt_version text NOT NULL,
      translated_at text NOT NULL,
      PRIMARY KEY(speech_id, locale),
      FOREIGN KEY (speech_id) REFERENCES speeches(id)
    )
  `).run()
  ensureTextColumn(db, 'speech_translations', 'model_reasoning_effort')
}

function writeBatch(batch, output) {
  const byId = new Map(output.translations.map((t) => [t.speech_id, t]))
  const now = new Date().toISOString()
  for (const job of batch) {
    const translated = byId.get(job.row.id)
    if (!translated) throw new Error(`missing speech translation for ${job.row.id}`)
    const text = trimOrNull(translated.text_full) ?? job.row.text_full
    db.prepare(`
      INSERT INTO speech_translations (
        speech_id, locale, text_excerpt, text_full, source_hash, model, model_reasoning_effort, prompt_version, translated_at
      ) VALUES (?, 'en', ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(speech_id, locale) DO UPDATE SET
        text_excerpt = excluded.text_excerpt,
        text_full = excluded.text_full,
        source_hash = excluded.source_hash,
        model = excluded.model,
        model_reasoning_effort = excluded.model_reasoning_effort,
        prompt_version = excluded.prompt_version,
        translated_at = excluded.translated_at
    `).run(job.row.id, excerpt(text), text, job.sourceHash, PREPROCESSING_MODEL, PREPROCESSING_REASONING_EFFORT, PROMPT_VERSION, now)
  }
}

function excerpt(text) {
  return text.replace(/\s+/g, ' ').trim().slice(0, 220)
}
