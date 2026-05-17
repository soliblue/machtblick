import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { pLimit } from '../polarity/limit.mjs'
import { buildPrompt, PROMPT_VERSION } from './prompt.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const schemaPath = fileURLToPath(new URL('./output-schema.json', import.meta.url))
const model = process.env.CODEX_MODEL ?? 'gpt-5.4-mini'
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

console.log(`antrag title jobs: ${selected.length}/${rows.length} rows, ${batches.length} batches, db=${dbPath}, model=${model}`)

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
    const output = await runCodex(buildPrompt(items))
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
  const columns = db.prepare('PRAGMA table_info(antraege)').all()
  const hasCleanTitle = columns.some((column) => column.name === 'clean_title')
  if (!hasCleanTitle) db.prepare('ALTER TABLE antraege ADD COLUMN clean_title text').run()
}

function runCodex(prompt) {
  const dir = mkdtempSync(join(tmpdir(), 'machtblick-antrag-title-codex-'))
  const outPath = join(dir, 'out.json')
  return new Promise((resolve, reject) => {
    let settled = false
    const c = spawn('codex', [
      '-a', 'never',
      'exec',
      '--model', model,
      '-c', 'model_reasoning_effort="low"',
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

function cleanText(value) {
  const text = String(value ?? '')
    .replaceAll('\u2014', ', ')
    .replaceAll('\u2013', '-')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > 100 ? `${text.slice(0, 97).trim()}...` : text || null
}
