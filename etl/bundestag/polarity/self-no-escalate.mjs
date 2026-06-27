import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applyInversion, defectionSignature } from './apply.mjs'
import { pLimit } from './limit.mjs'

const FRAKTIONEN = new Set(['CDU/CSU', 'B90/Grüne', 'Die Linke', 'AfD', 'SPD', 'FDP', 'BSW'])

const db = new Database(fileURLToPath(new URL('../../../db/machtblick.sqlite', import.meta.url)))
const root = fileURLToPath(new URL('../../..', import.meta.url))
const schemaPath = fileURLToPath(new URL('./output-schema-self-no.json', import.meta.url))
const model = process.env.CODEX_MODEL ?? 'gpt-5.5'
const provider = process.env.POLARITY_PROVIDER ?? 'codex'

const candidates = db.prepare(`
  SELECT v.id, v.title, v.document, v.result, v.yes, v.no, v.vote_type, v.initiator
  FROM votes v
  JOIN vote_party_summaries s ON s.vote_id = v.id AND s.party = v.initiator
  WHERE v.procedural = 0
    AND v.inverted = 0
    AND v.initiator IS NOT NULL
    AND s.position = 'no'
`).all().filter((r) => FRAKTIONEN.has(r.initiator))

console.log(`self-no escalate: ${candidates.length} candidates`)

const PROMPT = readFileSync(fileURLToPath(new URL('../../../prompts/etl/bundestag/polarity-self-no.md', import.meta.url)), 'utf8').trimEnd()

function runClaude(prompt) {
  return new Promise((resolve, reject) => {
    const c = spawn('claude', ['-p', '--model', 'sonnet', '--output-format', 'json'], { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    c.stdout.on('data', (d) => (stdout += d))
    c.stderr.on('data', (d) => (stderr += d))
    c.on('close', (code) => {
      if (code !== 0) return reject(new Error(`claude exit ${code}: ${stderr}`))
      resolve(stdout)
    })
    c.stdin.write(prompt)
    c.stdin.end()
  })
}

function runCodex(prompt) {
  const dir = mkdtempSync(join(tmpdir(), 'machtblick-polarity-self-no-'))
  const outPath = join(dir, 'out.json')
  return new Promise((resolve, reject) => {
    const c = spawn('codex', [
      '-a', 'never',
      'exec',
      '--model', model,
      '--sandbox', 'read-only',
      '--ignore-rules',
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

function parseLlm(raw) {
  const env = JSON.parse(raw)
  const text = typeof env.result === 'string' ? env.result : JSON.stringify(env.result ?? env)
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) throw new Error(`no JSON in claude output: ${text.slice(0, 200)}`)
  const obj = JSON.parse(m[0])
  return {
    inverted: obj.inverted === true,
    confidence: ['high', 'medium', 'low'].includes(obj.confidence) ? obj.confidence : 'low',
    reason: typeof obj.reason === 'string' ? obj.reason : '',
  }
}

const limit = pLimit(4)
const tasks = candidates.map((row) =>
  limit(async () => {
    const positions = db.prepare(`SELECT party, position FROM vote_party_summaries WHERE vote_id = ? ORDER BY party`).all(row.id)
    const posLine = positions.map((p) => `${p.party}=${p.position}`).join(', ')
    const prompt = PROMPT
      .replace('__TITLE__', row.title)
      .replace('__DOCUMENT__', row.document ?? '(nicht vorhanden)')
      .replace('__PROPOSER__', row.initiator)
      .replace('__POSITIONS__', posLine)
      .replace('__RESULT__', row.result)
    const raw = provider === 'claude' ? await runClaude(prompt) : await runCodex(prompt)
    const result = provider === 'claude' ? parseLlm(raw) : raw
    return { row, result }
  }),
)

const outcomes = await Promise.all(tasks)

let inverted = 0
let skipped = 0
const skippedRows = []
for (const { row, result } of outcomes) {
  if (!result.inverted || result.confidence === 'low') {
    skipped++
    skippedRows.push({ id: row.id, initiator: row.initiator, reason: result.reason, confidence: result.confidence })
    continue
  }
  const before = defectionSignature(db, row.id)
  applyInversion(db, row, { rewrittenTitle: row.title, source: 'llm-self-no', confidence: result.confidence, reason: result.reason })
  const after = defectionSignature(db, row.id)
  if (before !== after) console.warn(`⚠ defection signature changed for ${row.id}: ${before} → ${after}`)
  inverted++
}

console.log(`self-no escalate: inverted=${inverted} skipped=${skipped}`)
if (skipped > 0 && process.argv.includes('--verbose')) {
  console.log('skipped:')
  for (const r of skippedRows) console.log(`  ${r.id} initiator=${r.initiator} confidence=${r.confidence} reason=${r.reason}`)
}
db.close()
