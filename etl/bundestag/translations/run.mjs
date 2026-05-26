import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { buildPrompt, PROMPT_VERSION } from './prompt.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const schemaPath = fileURLToPath(new URL('./output-schema-batch.json', import.meta.url))
const model = process.env.CODEX_MODEL ?? 'gpt-5.2'
const concurrency = Number(argValue('--concurrency') ?? 2)
const batchSize = Number(argValue('--batch-size') ?? 4)
const limit = Number(argValue('--limit') ?? 0)
const voteFilter = argValue('--vote')
const termFilter = Number(argValue('--term') ?? 0)
const publicMissingOnly = process.argv.includes('--public-missing-only')
const dryRun = process.argv.includes('--dry-run')
const force = process.argv.includes('--force')
const dbPath = process.env.MACHTBLICK_DB ?? findDbPath()
const db = new Database(dbPath)

ensureSchema()

const candidates = db.prepare(`
  SELECT id, title, clean_title, topic, subject, summary, summary_simplified, summary_detail
  FROM votes
  WHERE procedural = 0
    AND vote_type != 'hammelsprung'
    AND (? IS NULL OR id = ?)
    AND (? = 0 OR term_id = ?)
  ORDER BY date DESC, bundestag_id DESC
`).all(voteFilter ?? null, voteFilter ?? null, termFilter, termFilter)

const existingVotes = new Map(
  db.prepare('SELECT vote_id, clean_title, summary, summary_simplified, summary_detail, source_hash FROM vote_translations WHERE locale = ?').all('en').map((r) => [r.vote_id, r]),
)
const existingSummaries = new Map(
  db.prepare('SELECT vote_id, party, position_summary, key_points, dissent_note, source_hash FROM vote_party_summary_translations WHERE locale = ?').all('en').map((r) => [`${r.vote_id}\u0000${r.party}`, r]),
)

const jobs = []
for (const vote of candidates) {
  const summaries = db.prepare(`
    SELECT vote_id, party, position_summary, key_points, dissent_note
    FROM vote_party_summaries
    WHERE vote_id = ?
      AND (position_summary IS NOT NULL OR key_points IS NOT NULL OR dissent_note IS NOT NULL)
    ORDER BY members DESC, party ASC
  `).all(vote.id)
  const voteHash = sourceHash(vote)
  const summaryHashes = summaries.map((s) => ({ party: s.party, hash: sourceHash(s) }))
  const existingVote = existingVotes.get(vote.id)
  const missingVoteField = !existingVote
    || (vote.clean_title && !existingVote.clean_title)
    || (vote.summary && !existingVote.summary)
    || (vote.summary_simplified && !existingVote.summary_simplified)
    || (vote.summary_detail && !existingVote.summary_detail)
  const missingSummaryField = summaries.some((s) => {
    const existing = existingSummaries.get(`${s.vote_id}\u0000${s.party}`)
    return !existing
      || (s.position_summary && !existing.position_summary)
      || (s.key_points && !existing.key_points)
      || (s.dissent_note && !existing.dissent_note)
  })
  const staleVote = publicMissingOnly ? missingVoteField : force || existingVote?.source_hash !== voteHash
  const staleSummary = publicMissingOnly ? missingSummaryField : summaryHashes.some((s) => force || existingSummaries.get(`${vote.id}\u0000${s.party}`)?.source_hash !== s.hash)
  if (staleVote || staleSummary) jobs.push({ vote, voteHash, summaries, summaryHashes })
}

const selected = limit > 0 ? jobs.slice(0, limit) : jobs
const batches = chunk(selected, batchSize)
console.log(`translation jobs: ${selected.length}/${jobs.length} eligible, batches=${batches.length}, batchSize=${batchSize}, db=${dbPath}, model=${model}`)
if (dryRun) {
  db.close()
  process.exit(0)
}

let cursor = 0
const workers = Array.from({ length: Math.min(concurrency, batches.length) }, async () => {
  while (cursor < batches.length) {
    const batch = batches[cursor]
    cursor++
    const output = await runCodex(buildPrompt({
      jobs: batch.map((job) => ({
        vote: job.vote,
        party_summaries: job.summaries.map((s) => ({
          party: s.party,
          position_summary: s.position_summary,
          key_points: s.key_points,
          dissent_note: s.dissent_note,
        })),
      })),
    }))
    writeBatch(batch, output)
    console.log(batch.map((job) => job.vote.id).join(', '))
  }
})

await Promise.all(workers)
db.close()

function argValue(name) {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : null
}

function chunk(items, size) {
  const chunks = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
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
    CREATE TABLE IF NOT EXISTS vote_translations (
      vote_id text NOT NULL,
      locale text NOT NULL,
      title text NOT NULL,
      clean_title text,
      topic text,
      subject text,
      summary text,
      summary_simplified text,
      summary_detail text,
      source_hash text NOT NULL,
      model text NOT NULL,
      prompt_version text NOT NULL,
      translated_at text NOT NULL,
      PRIMARY KEY(vote_id, locale),
      FOREIGN KEY (vote_id) REFERENCES votes(id)
    )
  `).run()
  db.prepare(`
    CREATE TABLE IF NOT EXISTS vote_party_summary_translations (
      vote_id text NOT NULL,
      party text NOT NULL,
      locale text NOT NULL,
      position_summary text,
      key_points text,
      dissent_note text,
      source_hash text NOT NULL,
      model text NOT NULL,
      prompt_version text NOT NULL,
      translated_at text NOT NULL,
      PRIMARY KEY(vote_id, party, locale),
      FOREIGN KEY (vote_id) REFERENCES votes(id)
    )
  `).run()
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

function sourceHash(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function runCodex(prompt) {
  const dir = mkdtempSync(join(tmpdir(), 'machtblick-translation-'))
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

function writeTranslations(job, output) {
  const now = new Date().toISOString()
  const vote = output.vote
  db.prepare(`
    INSERT INTO vote_translations (
      vote_id, locale, title, clean_title, topic, subject, summary, summary_simplified, summary_detail,
      source_hash, model, prompt_version, translated_at
    ) VALUES (?, 'en', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(vote_id, locale) DO UPDATE SET
      title = excluded.title,
      clean_title = excluded.clean_title,
      topic = excluded.topic,
      subject = excluded.subject,
      summary = excluded.summary,
      summary_simplified = excluded.summary_simplified,
      summary_detail = excluded.summary_detail,
      source_hash = excluded.source_hash,
      model = excluded.model,
      prompt_version = excluded.prompt_version,
      translated_at = excluded.translated_at
  `).run(
    job.vote.id,
    clean(vote.title) ?? job.vote.title,
    clean(vote.clean_title),
    clean(vote.topic),
    clean(vote.subject),
    clean(vote.summary),
    clean(vote.summary_simplified),
    clean(vote.summary_detail),
    job.voteHash,
    model,
    PROMPT_VERSION,
    now,
  )
  syncAntragTranslation(job, vote, now)
  const byParty = new Map(output.party_summaries.map((s) => [s.party, s]))
  for (const source of job.summaries) {
    const translated = byParty.get(source.party)
    if (translated) {
      const hash = job.summaryHashes.find((s) => s.party === source.party).hash
      db.prepare(`
        INSERT INTO vote_party_summary_translations (
          vote_id, party, locale, position_summary, key_points, dissent_note,
          source_hash, model, prompt_version, translated_at
        ) VALUES (?, ?, 'en', ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(vote_id, party, locale) DO UPDATE SET
          position_summary = excluded.position_summary,
          key_points = excluded.key_points,
          dissent_note = excluded.dissent_note,
          source_hash = excluded.source_hash,
          model = excluded.model,
          prompt_version = excluded.prompt_version,
          translated_at = excluded.translated_at
      `).run(
        job.vote.id,
        source.party,
        clean(translated.position_summary),
        clean(translated.key_points),
        clean(translated.dissent_note),
        hash,
        model,
        PROMPT_VERSION,
        now,
      )
    } else console.warn(`missing party summary translation for ${job.vote.id} ${source.party}`)
  }
}

function syncAntragTranslation(job, vote, now) {
  const matches = db.prepare(`
    SELECT a.id
    FROM antraege a
    INNER JOIN vote_description_decisions vdd ON vdd.drucksache_id = a.drucksache
    WHERE a.wahlperiode = 21 AND vdd.vote_id = ?
  `).all(job.vote.id)
  if (matches.length === 1) {
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
      matches[0].id,
      clean(vote.summary_simplified),
      clean(vote.summary_detail),
      job.voteHash,
      model,
      PROMPT_VERSION,
      now,
    )
  }
}

function writeBatch(batch, output) {
  const byId = new Map(output.translations.map((t) => [t.vote_id, t]))
  for (const job of batch) {
    const translated = byId.get(job.vote.id)
    if (translated) writeTranslations(job, translated)
    else console.warn(`missing vote translation for ${job.vote.id}`)
  }
}

function clean(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}
