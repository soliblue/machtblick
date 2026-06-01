import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { buildPrompt, PROMPT_VERSION } from './prompt.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const schemaPath = fileURLToPath(new URL('./output-schema.json', import.meta.url))
const model = process.env.CODEX_MODEL ?? 'gpt-5.2'
const concurrency = Number(argValue('--concurrency') ?? 2)
const limit = Number(argValue('--limit') ?? 0)
const minWords = Number(argValue('--min-words') ?? 150)
const voteFilter = argValue('--vote')
const voteType = argValue('--vote-type') ?? 'namentlich'
const force = process.argv.includes('--force')
const dbPath = process.env.MACHTBLICK_DB ?? findDbPath()
const db = new Database(dbPath)

const CHAIR_ROLES = new Set([
  'Präsident',
  'Präsidentin',
  'Vizepräsident',
  'Vizepräsidentin',
  'Alterspräsident',
  'Alterspräsidentin',
])

ensureSchema()

const candidates = db.prepare(`
  SELECT v.id AS vote_id, v.date, v.agenda_item, v.title, v.clean_title, v.summary, v.summary_simplified, v.result,
         s.party, s.position, s.members, s.yes, s.no, s.abstain, s.absent, s.position_summary
  FROM vote_party_summaries s
  INNER JOIN votes v ON v.id = s.vote_id
  WHERE (? = 'all' OR v.vote_type = ?)
    AND v.procedural = 0
    AND (? IS NULL OR v.id = ?)
  ORDER BY v.date DESC, v.bundestag_id DESC, s.members DESC
`).all(voteType, voteType, voteFilter ?? null, voteFilter ?? null)

const jobs = []
for (const row of candidates) {
  const speeches = loadSpeeches(row, row.party)
  const words = speeches.reduce((sum, s) => sum + s.word_count, 0)
  if (speeches.length > 0 && words >= minWords && (force || !row.position_summary)) jobs.push({ row, speeches })
}

const selected = limit > 0 ? jobs.slice(0, limit) : jobs
console.log(`party position jobs: ${selected.length}/${jobs.length} eligible, db=${dbPath}, model=${model}`)

let cursor = 0
const workers = Array.from({ length: Math.min(concurrency, selected.length) }, async () => {
  while (cursor < selected.length) {
    const job = selected[cursor]
    cursor++
    const output = await runCodex(buildPrompt({ vote: job.row, speeches: job.speeches }))
    writeSummary(job, output)
    console.log(`${job.row.vote_id} ${job.row.party}: ${job.speeches.length} speeches`)
  }
})

await Promise.all(workers)
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
  const columns = db.prepare('PRAGMA table_info(vote_party_summaries)').all().map((c) => c.name)
  if (!columns.includes('position_summary')) db.prepare('ALTER TABLE vote_party_summaries ADD COLUMN position_summary text').run()
  if (!columns.includes('key_points')) db.prepare('ALTER TABLE vote_party_summaries ADD COLUMN key_points text').run()
  if (!columns.includes('dissent_note')) db.prepare('ALTER TABLE vote_party_summaries ADD COLUMN dissent_note text').run()
  db.prepare(`
    CREATE TABLE IF NOT EXISTS vote_party_summary_decisions (
      vote_id text NOT NULL,
      party text NOT NULL,
      source_speech_ids text NOT NULL,
      model text NOT NULL,
      prompt_version text NOT NULL,
      generated_at text NOT NULL,
      PRIMARY KEY(vote_id, party),
      FOREIGN KEY (vote_id, party) REFERENCES vote_party_summaries(vote_id, party)
    )
  `).run()
}

function loadSpeeches(vote, party) {
  const grouped = filterSpeeches(db.prepare(`
    SELECT s.id, s.speaker_name, s.speaker_role, COALESCE(sdgs.position, s.position) AS position, s.text_full, s.word_count
    FROM vote_debate_groups vdg
    INNER JOIN speech_debate_group_speeches sdgs ON sdgs.group_id = vdg.group_id
    INNER JOIN speeches s ON s.id = sdgs.speech_id
    WHERE vdg.vote_id = ?
      AND s.party = ?
    ORDER BY COALESCE(sdgs.position, s.position) ASC
  `).all(vote.vote_id, party))
  if (grouped.length) return grouped
  const direct = filterSpeeches(db.prepare(`
    SELECT id, speaker_name, speaker_role, position, text_full, word_count
    FROM speeches
    WHERE vote_id = ?
      AND party = ?
    ORDER BY position ASC
  `).all(vote.vote_id, party))
  return direct.length || !vote.agenda_item
    ? direct
    : filterSpeeches(db.prepare(`
      SELECT id, speaker_name, speaker_role, position, text_full, word_count
      FROM speeches
      WHERE date = ?
        AND agenda_item = ?
        AND party = ?
      ORDER BY position ASC
    `).all(vote.date, vote.agenda_item, party))
}

function filterSpeeches(rows) {
  return rows.filter((s) => !s.speaker_role || !CHAIR_ROLES.has(s.speaker_role))
}

function runCodex(prompt) {
  const dir = mkdtempSync(join(tmpdir(), 'machtblick-codex-'))
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

function writeSummary({ row, speeches }, output) {
  const summary = cleanText(output.position_summary)
  const points = output.key_points.map(cleanText).filter(Boolean).map((p) => `- ${p}`).join('\n')
  const dissent = output.dissent_note ? cleanText(output.dissent_note) : null
  if (!summary) throw new Error(`empty summary for ${row.vote_id} ${row.party}`)
  db.prepare(`
    UPDATE vote_party_summaries
    SET position_summary = ?, key_points = ?, dissent_note = ?
    WHERE vote_id = ? AND party = ?
  `).run(summary, points || null, dissent, row.vote_id, row.party)
  db.prepare(`
    INSERT INTO vote_party_summary_decisions (vote_id, party, source_speech_ids, model, prompt_version, generated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(vote_id, party) DO UPDATE SET
      source_speech_ids = excluded.source_speech_ids,
      model = excluded.model,
      prompt_version = excluded.prompt_version,
      generated_at = excluded.generated_at
  `).run(row.vote_id, row.party, JSON.stringify(speeches.map((s) => s.id)), model, PROMPT_VERSION, new Date().toISOString())
}

function cleanText(text) {
  return String(text ?? '')
    .replaceAll('\u2014', ', ')
    .replaceAll('\u2013', '-')
    .trim()
}
