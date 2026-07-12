import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { argValue, findDbPath, normalizeDashes } from '../../_shared/worker.mjs'
import { buildPrompt, PROMPT_VERSION } from './prompt.mjs'
import { runPreprocessingCodex } from '../preprocessing/codex.mjs'
import { PREPROCESSING_MODEL, PREPROCESSING_REASONING_EFFORT } from '../preprocessing/config.mjs'
import { ensureTextColumn } from '../preprocessing/schema.mjs'

const schemaPath = fileURLToPath(new URL('./output-schema.json', import.meta.url))
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
  SELECT v.id AS vote_id, v.date, v.agenda_item, v.title, v.clean_title, v.summary, v.summary_simplified, v.result, v.inverted,
         s.party, s.position, s.members, s.yes, s.no, s.abstain, s.absent, s.position_summary,
         d.generated_at, p.decided_at
  FROM vote_party_summaries s
  INNER JOIN votes v ON v.id = s.vote_id
  LEFT JOIN vote_party_summary_decisions d ON d.vote_id = s.vote_id AND d.party = s.party
  LEFT JOIN vote_polarity_decisions p ON p.vote_id = s.vote_id AND p.inverted = 1
  WHERE (? = 'all' OR v.vote_type = ?)
    AND v.procedural = 0
    AND (? IS NULL OR v.id = ?)
  ORDER BY v.date DESC, v.bundestag_id DESC, s.members DESC
`).all(voteType, voteType, voteFilter ?? null, voteFilter ?? null)

const jobs = []
for (const row of candidates) {
  const speeches = loadSpeeches(row, row.party)
  const words = speeches.reduce((sum, s) => sum + s.word_count, 0)
  const stale = row.decided_at && row.generated_at && row.generated_at < row.decided_at
  if (speeches.length > 0 && words >= minWords && (force || !row.position_summary || stale)) jobs.push({ row, speeches })
}

const selected = limit > 0 ? jobs.slice(0, limit) : jobs
console.log(`party position jobs: ${selected.length}/${jobs.length} eligible, db=${dbPath}, model=${PREPROCESSING_MODEL}, reasoning=${PREPROCESSING_REASONING_EFFORT}`)

let cursor = 0
const workers = Array.from({ length: Math.min(concurrency, selected.length) }, async () => {
  while (cursor < selected.length) {
    const job = selected[cursor]
    cursor++
    const output = await runPreprocessingCodex({
      prompt: buildPrompt({ vote: job.row, speeches: job.speeches }),
      schemaPath,
      tmpPrefix: 'machtblick-codex-',
    })
    writeSummary(job, output)
    console.log(`${job.row.vote_id} ${job.row.party}: ${job.speeches.length} speeches`)
  }
})

await Promise.all(workers)
db.close()

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
      model_reasoning_effort text,
      prompt_version text NOT NULL,
      generated_at text NOT NULL,
      PRIMARY KEY(vote_id, party),
      FOREIGN KEY (vote_id, party) REFERENCES vote_party_summaries(vote_id, party)
    )
  `).run()
  ensureTextColumn(db, 'vote_party_summary_decisions', 'model_reasoning_effort')
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

function writeSummary({ row, speeches }, output) {
  const summary = normalizeDashes(output.position_summary)
  const points = output.key_points.map(normalizeDashes).filter(Boolean).map((p) => `- ${p}`).join('\n')
  const dissent = output.dissent_note ? normalizeDashes(output.dissent_note) : null
  if (!summary) throw new Error(`empty summary for ${row.vote_id} ${row.party}`)
  db.prepare(`
    UPDATE vote_party_summaries
    SET position_summary = ?, key_points = ?, dissent_note = ?
    WHERE vote_id = ? AND party = ?
  `).run(summary, points || null, dissent, row.vote_id, row.party)
  db.prepare(`
    INSERT INTO vote_party_summary_decisions (vote_id, party, source_speech_ids, model, model_reasoning_effort, prompt_version, generated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(vote_id, party) DO UPDATE SET
      source_speech_ids = excluded.source_speech_ids,
      model = excluded.model,
      model_reasoning_effort = excluded.model_reasoning_effort,
      prompt_version = excluded.prompt_version,
      generated_at = excluded.generated_at
  `).run(row.vote_id, row.party, JSON.stringify(speeches.map((s) => s.id)), PREPROCESSING_MODEL, PREPROCESSING_REASONING_EFFORT, PROMPT_VERSION, new Date().toISOString())
}

