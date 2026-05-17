import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const PROMPT_VERSION = 'antrag-translation-en-v1'
const root = fileURLToPath(new URL('../../..', import.meta.url))
const schemaPath = fileURLToPath(new URL('./output-schema.json', import.meta.url))
const model = process.env.CODEX_MODEL ?? 'gpt-5.2'
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
console.log(`antrag translation jobs: ${selected.length}/${jobs.length} eligible, batches=${batches.length}, batchSize=${batchSize}, db=${dbPath}, model=${model}`)

let cursor = 0
let completed = 0
let failed = 0

const workers = Array.from({ length: Math.min(concurrency, batches.length) }, async () => {
  while (cursor < batches.length) {
    const batch = batches[cursor]
    cursor++
    try {
      const output = await runCodex(buildPrompt(batch.map((job) => job.row)))
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
  db.prepare(`
    CREATE TABLE IF NOT EXISTS antrag_description_translations (
      antrag_id integer NOT NULL,
      locale text NOT NULL,
      summary_simplified text,
      summary_detail text,
      source_hash text,
      model text,
      prompt_version text,
      translated_at text,
      PRIMARY KEY(antrag_id, locale),
      FOREIGN KEY (antrag_id) REFERENCES antraege(id)
    )
  `).run()
}

function sourceHash(summarySimplified, summaryDetail) {
  return createHash('sha256').update(JSON.stringify({ summarySimplified, summaryDetail })).digest('hex')
}

function stale(antragId, hash) {
  const row = db.prepare('SELECT source_hash FROM antrag_description_translations WHERE antrag_id = ? AND locale = ?').get(antragId, 'en')
  return row?.source_hash !== hash
}

function chunk(items, size) {
  const chunks = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

function buildPrompt(rows) {
  return `Translate German Bundestag Antrag summaries into clear, neutral English for a public transparency website.

Rules:
- Return strict JSON matching the schema.
- Return one translations item per input row, in the same order, with the same antrag_id.
- Preserve markdown structure, headings, bullet lists, bold and italic emphasis.
- Preserve party names, person names, document numbers, law names, institution names, dates, counts, and URLs.
- Keep "Bundestag" as Bundestag.
- Do not add facts, opinions, caveats, markdown outside translated fields, or commentary.
- Do not use Unicode dash punctuation.

Input JSON:
${JSON.stringify({ rows }, null, 2)}
`
}

function runCodex(prompt) {
  const dir = mkdtempSync(join(tmpdir(), 'machtblick-antrag-translation-'))
  const outPath = join(dir, 'out.json')
  return new Promise((resolve, reject) => {
    let settled = false
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
    const timer = setTimeout(() => {
      settled = true
      c.kill('SIGTERM')
      rmSync(dir, { recursive: true, force: true })
      reject(new Error(`codex timed out after ${timeoutMs}ms`))
    }, timeoutMs)
    c.stderr.on('data', (d) => (stderr += d))
    c.on('close', (code) => {
      clearTimeout(timer)
      if (settled) return
      settled = true
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
  const byId = new Map(output.translations.map((t) => [t.antrag_id, t]))
  const now = new Date().toISOString()
  for (const job of batch) {
    const translated = byId.get(job.row.antrag_id)
    if (!translated) throw new Error(`missing Antrag translation for ${job.row.antrag_id}`)
    db.prepare(`
      INSERT INTO antrag_description_translations (
        antrag_id, locale, summary_simplified, summary_detail, source_hash, model, prompt_version, translated_at
      ) VALUES (?, 'en', ?, ?, ?, ?, ?, ?)
      ON CONFLICT(antrag_id, locale) DO UPDATE SET
        summary_simplified = excluded.summary_simplified,
        summary_detail = excluded.summary_detail,
        source_hash = excluded.source_hash,
        model = excluded.model,
        prompt_version = excluded.prompt_version,
        translated_at = excluded.translated_at
    `).run(
      job.row.antrag_id,
      clean(translated.summary_simplified),
      clean(translated.summary_detail),
      job.hash,
      model,
      PROMPT_VERSION,
      now,
    )
  }
}

function clean(value) {
  return String(value ?? '')
    .replaceAll('\u2014', ', ')
    .replaceAll('\u2013', '-')
    .trim()
}
