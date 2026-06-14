import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const root = fileURLToPath(new URL('..', import.meta.url))
const db = new Database(fileURLToPath(new URL('./machtblick.sqlite', import.meta.url)))
const model = process.env.CODEX_MODEL ?? 'gpt-5.5'
const schemaPath = fileURLToPath(new URL('./repair-inverted-handzeichen-summary-schema.json', import.meta.url))
const promptTemplate = readFileSync(fileURLToPath(new URL('../prompts/etl/bundestag/repair-inverted-handzeichen-summary.md', import.meta.url)), 'utf8').trimEnd()
const force = process.argv.includes('--force')

db.prepare(`
  CREATE TABLE IF NOT EXISTS vote_summary_repairs (
    vote_id text PRIMARY KEY,
    source_hash text NOT NULL,
    model text NOT NULL,
    repaired_at text NOT NULL,
    FOREIGN KEY (vote_id) REFERENCES votes(id)
  )
`).run()

type Row = {
  id: string
  title: string
  rewritten_title: string | null
  document: string | null
  initiator: string | null
  result: string
  summary: string | null
}

const rows = db.prepare(`
  SELECT v.id, v.title, v.document, v.initiator, v.result, v.summary, p.rewritten_title
  FROM votes v
  LEFT JOIN vote_polarity_decisions p ON p.vote_id = v.id
  WHERE v.inverted = 1 AND v.procedural = 0 AND v.vote_type = 'handzeichen'
  ORDER BY v.id
`).all() as Row[]

const positionsOf = db.prepare(`
  SELECT party, position FROM vote_party_summaries WHERE vote_id = ? AND position IS NOT NULL ORDER BY members DESC, party ASC
`)
const repaired = new Map(
  (db.prepare('SELECT vote_id, source_hash FROM vote_summary_repairs').all() as Array<{ vote_id: string; source_hash: string }>)
    .map((r) => [r.vote_id, r.source_hash]),
)

const update = db.prepare('UPDATE votes SET summary = ? WHERE id = ?')
const record = db.prepare(`
  INSERT INTO vote_summary_repairs (vote_id, source_hash, model, repaired_at)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(vote_id) DO UPDATE SET source_hash = excluded.source_hash, model = excluded.model, repaired_at = excluded.repaired_at
`)

const jobs = rows.map((row) => {
  const positions = (positionsOf.all(row.id) as Array<{ party: string; position: string }>)
  const title = row.rewritten_title ?? row.title
  const positionText = positions.map((p) => `${p.party}: ${germanPosition(p.position)}`).join('; ')
  const hash = createHash('sha256').update(JSON.stringify({ title, document: row.document, initiator: row.initiator, result: row.result, positionText })).digest('hex')
  return { row, title, positionText, hash }
}).filter((j) => force || repaired.get(j.row.id) !== j.hash)

console.log(`inverted handzeichen summaries: ${jobs.length}/${rows.length} to repair (model=${model})`)

for (const job of jobs) {
  const prompt = promptTemplate
    .replace('__TITLE__', job.title)
    .replace('__PROPOSER__', job.row.initiator ?? '(unbekannt)')
    .replace('__DOCUMENT__', job.row.document ?? '(nicht vorhanden)')
    .replace('__POSITIONS__', job.positionText)
    .replace('__STALE__', job.row.summary ?? '(nicht vorhanden)')
  const out = await runCodex(prompt)
  const summary = clean(out.summary)
  if (!summary) throw new Error(`empty summary for ${job.row.id}`)
  update.run(summary, job.row.id)
  record.run(job.row.id, job.hash, model, new Date().toISOString())
  console.log(`  ${job.row.id}: ${summary.slice(0, 90)}`)
}

db.close()

function germanPosition(position: string) {
  return position === 'yes' ? 'dafür' : position === 'no' ? 'dagegen' : position === 'abstain' ? 'enthalten' : position
}

function clean(value: string) {
  return String(value ?? '')
    .replaceAll('—', ', ')
    .replaceAll('–', '-')
    .replaceAll(' -- ', ', ')
    .trim()
}

function runCodex(prompt: string): Promise<{ summary: string }> {
  const dir = mkdtempSync(join(tmpdir(), 'machtblick-summary-repair-'))
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
