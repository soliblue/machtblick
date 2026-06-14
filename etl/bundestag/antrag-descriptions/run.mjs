import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { extractPdf } from '../descriptions/extractPdf.mjs'
import { buildPrompt, PROMPT_VERSION } from '../descriptions/prompt.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const schemaPath = fileURLToPath(new URL('./output-schema.json', import.meta.url))
const model = process.env.CODEX_MODEL ?? 'gpt-5.5'
const timeoutMs = Number(process.env.CODEX_TIMEOUT_MS ?? 240000)
const concurrency = Number(argValue('--concurrency') ?? 2)
const limit = Number(argValue('--limit') ?? 0)
const antragFilter = argValue('--antrag')
const force = process.argv.includes('--force')
const dbPath = process.env.MACHTBLICK_DB ?? findDbPath()
const db = new Database(dbPath)

ensureSchema()

const candidates = db.prepare(`
  SELECT a.id, a.type, a.title, a.drucksache, a.drucksache_pdf_url
  FROM antraege a
  LEFT JOIN antrag_descriptions ad ON ad.antrag_id = a.id
  WHERE a.wahlperiode = 21
    AND a.drucksache IS NOT NULL
    AND a.drucksache_pdf_url IS NOT NULL
    AND (? IS NULL OR a.id = ?)
    AND (? = 1 OR ad.summary_simplified IS NULL OR ad.summary_detail IS NULL)
  ORDER BY a.introduced_date DESC, a.id DESC
`).all(antragFilter ?? null, antragFilter ?? null, force ? 1 : 0)

const selected = limit > 0 ? candidates.slice(0, limit) : candidates
console.log(`antrag description jobs: ${selected.length}/${candidates.length} eligible, db=${dbPath}, model=${model}`)

let cursor = 0
let completed = 0
let skipped = 0
let failed = 0

const workers = Array.from({ length: Math.min(concurrency, selected.length) }, async () => {
  while (cursor < selected.length) {
    const row = selected[cursor]
    cursor++
    try {
      const text = await extractPdf(row.drucksache, row.drucksache_pdf_url)
      if (!text || text.length < 200) {
        skipped++
        console.warn(`x ${row.id} text too short (${row.drucksache})`)
      } else {
        const output = await runCodex(buildPrompt(row.title, text, 'antrag'))
        writeSummary(row, output)
        completed++
        console.log(`${row.id} ${row.drucksache}`)
      }
    } catch (e) {
      failed++
      console.warn(`x ${row.id} failed (${row.drucksache}): ${e.message}`)
    }
  }
})

await Promise.all(workers)
console.log(`done. completed=${completed} skipped=${skipped} failed=${failed}`)
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
    CREATE TABLE IF NOT EXISTS antrag_descriptions (
      antrag_id integer PRIMARY KEY NOT NULL,
      summary_simplified text,
      summary_detail text,
      source_vote_id text,
      source_pdf_url text,
      model text,
      generated_at text,
      prompt_version integer,
      FOREIGN KEY (antrag_id) REFERENCES antraege(id),
      FOREIGN KEY (source_vote_id) REFERENCES votes(id)
    )
  `).run()
}

function runCodex(prompt) {
  const dir = mkdtempSync(join(tmpdir(), 'machtblick-antrag-codex-'))
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

function writeSummary(row, output) {
  const summarySimplified = cleanText(output.summary_simplified)
  const summaryDetail = cleanText(output.summary_detail)
  if (!summarySimplified || !summaryDetail) throw new Error(`incomplete output for ${row.id}`)
  db.prepare(`
    INSERT INTO antrag_descriptions (
      antrag_id, summary_simplified, summary_detail, source_vote_id, source_pdf_url, model, generated_at, prompt_version
    ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?)
    ON CONFLICT(antrag_id) DO UPDATE SET
      summary_simplified = excluded.summary_simplified,
      summary_detail = excluded.summary_detail,
      source_vote_id = excluded.source_vote_id,
      source_pdf_url = excluded.source_pdf_url,
      model = excluded.model,
      generated_at = excluded.generated_at,
      prompt_version = excluded.prompt_version
  `).run(row.id, summarySimplified, summaryDetail, row.drucksache_pdf_url, model, new Date().toISOString(), PROMPT_VERSION)
}

function cleanText(value) {
  return String(value ?? '')
    .replaceAll('\u2014', ', ')
    .replaceAll('\u2013', '-')
    .trim()
}
