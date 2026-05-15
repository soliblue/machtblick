import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { buildPrompt, PROMPT_VERSION } from './prompt.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const schemaPath = fileURLToPath(new URL('./output-schema.json', import.meta.url))
const model = process.env.CODEX_MODEL ?? 'gpt-5.2'
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
console.log(`speech translation jobs: ${selected.length}/${jobs.length} eligible, batches=${batches.length}, maxWords=${maxWords}, maxItems=${maxItems}, db=${dbPath}, model=${model}`)

let cursor = 0
const workers = Array.from({ length: Math.min(concurrency, batches.length) }, async () => {
  while (cursor < batches.length) {
    const batch = batches[cursor]
    cursor++
    const output = await runCodex(buildPrompt({
      speeches: batch.map(({ row }) => ({
        speech_id: row.id,
        speaker_name: row.speaker_name,
        speaker_role: row.speaker_role,
        party: row.party,
        text_full: row.text_full,
      })),
    }))
    writeBatch(batch, output)
    console.log(batch.map(({ row }) => row.id).join(', '))
  }
})

await Promise.all(workers)
db.close()

function argValue(name) {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : null
}

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
  db.prepare(`
    CREATE TABLE IF NOT EXISTS speech_translations (
      speech_id text NOT NULL,
      locale text NOT NULL,
      text_excerpt text NOT NULL,
      text_full text NOT NULL,
      source_hash text NOT NULL,
      model text NOT NULL,
      prompt_version text NOT NULL,
      translated_at text NOT NULL,
      PRIMARY KEY(speech_id, locale),
      FOREIGN KEY (speech_id) REFERENCES speeches(id)
    )
  `).run()
}

function sourceHash(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function runCodex(prompt) {
  const dir = mkdtempSync(join(tmpdir(), 'machtblick-speech-translation-'))
  const outPath = join(dir, 'out.json')
  return new Promise((resolve, reject) => {
    const c = spawn('codex', [
      '-a', 'never',
      'exec',
      '--model', model,
      '--sandbox', 'read-only',
      '--output-schema', schemaPath,
      '--output-last-message', outPath,
      '--cd', root,
      '--ephemeral',
      '-',
    ], { stdio: ['pipe', 'pipe', 'pipe'] })
    let stderr = ''
    c.stderr.on('data', (d) => (stderr += d))
    c.on('close', (code) => {
      if (code !== 0) {
        rmSync(dir, { recursive: true, force: true })
        reject(new Error(`codex exit ${code}: ${stderr}`))
        return
      }
      const text = readFileSync(outPath, 'utf8')
      rmSync(dir, { recursive: true, force: true })
      resolve(JSON.parse(text))
    })
    c.stdin.write(prompt)
    c.stdin.end()
  })
}

function writeBatch(batch, output) {
  const byId = new Map(output.translations.map((t) => [t.speech_id, t]))
  const now = new Date().toISOString()
  for (const job of batch) {
    const translated = byId.get(job.row.id)
    if (!translated) throw new Error(`missing speech translation for ${job.row.id}`)
    const text = clean(translated.text_full) ?? job.row.text_full
    db.prepare(`
      INSERT INTO speech_translations (
        speech_id, locale, text_excerpt, text_full, source_hash, model, prompt_version, translated_at
      ) VALUES (?, 'en', ?, ?, ?, ?, ?, ?)
      ON CONFLICT(speech_id, locale) DO UPDATE SET
        text_excerpt = excluded.text_excerpt,
        text_full = excluded.text_full,
        source_hash = excluded.source_hash,
        model = excluded.model,
        prompt_version = excluded.prompt_version,
        translated_at = excluded.translated_at
    `).run(job.row.id, excerpt(text), text, job.sourceHash, model, PROMPT_VERSION, now)
  }
}

function clean(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function excerpt(text) {
  return text.replace(/\s+/g, ' ').trim().slice(0, 220)
}
