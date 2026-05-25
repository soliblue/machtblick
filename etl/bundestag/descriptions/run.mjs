import Database from 'better-sqlite3'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pickAntragWithFallback } from './pickAntrag.mjs'
import { extractPdf } from './extractPdf.mjs'
import { generateDescriptions } from './llm.mjs'
import { PROMPT_VERSION } from './prompt.mjs'
import { pLimit } from '../polarity/limit.mjs'

const dbPath = process.env.MACHTBLICK_DB ?? findDbPath()
const db = new Database(dbPath)

ensureSchema()

const candidates = db.prepare(`
  SELECT v.id, v.title
  FROM votes v
  WHERE v.procedural = 0
    AND v.summary_simplified IS NULL
`).all()

console.log(`descriptions: ${candidates.length} candidates`)

const updateVote = db.prepare(`UPDATE votes SET summary_simplified = ?, summary_detail = ? WHERE id = ?`)
const upsertDecision = db.prepare(`
  INSERT INTO vote_description_decisions (vote_id, drucksache_id, source_pdf_url, model, generated_at, prompt_version)
  VALUES (?, ?, ?, 'sonnet', ?, ?)
  ON CONFLICT(vote_id) DO UPDATE SET drucksache_id = excluded.drucksache_id, source_pdf_url = excluded.source_pdf_url, model = excluded.model, generated_at = excluded.generated_at, prompt_version = excluded.prompt_version
`)
const antragByDrucksache = db.prepare(`SELECT id FROM antraege WHERE wahlperiode = 21 AND drucksache = ?`)
const upsertAntragDescription = db.prepare(`
  INSERT INTO antrag_descriptions (
    antrag_id, summary_simplified, summary_detail, source_vote_id, source_pdf_url, model, generated_at, prompt_version
  ) VALUES (?, ?, ?, ?, ?, 'sonnet', ?, ?)
  ON CONFLICT(antrag_id) DO UPDATE SET
    summary_simplified = excluded.summary_simplified,
    summary_detail = excluded.summary_detail,
    source_vote_id = excluded.source_vote_id,
    source_pdf_url = excluded.source_pdf_url,
    model = excluded.model,
    generated_at = excluded.generated_at,
    prompt_version = excluded.prompt_version
`)

const counts = { antrag: 0, petitionen: 0, wahleinspruch: 0, verordnung: 0 }
let skippedNoPdf = 0
let llmFailure = 0

const limit = pLimit(4)

async function processVote(row) {
  const picked = await pickAntragWithFallback(row.id, db)
  if (!picked) {
    skippedNoPdf++
    return
  }
  let text
  try {
    text = await extractPdf(picked.drucksacheId, picked.pdfUrl)
  } catch (e) {
    llmFailure++
    console.warn(`x ${row.id} extract failed (${picked.drucksacheId}): ${e.message}`)
    return
  }
  if (!text || text.length < 200) {
    llmFailure++
    console.warn(`x ${row.id} text too short (${picked.drucksacheId}): ${text?.length ?? 0} chars`)
    return
  }
  try {
    const { summarySimplified, summaryDetail } = await generateDescriptions(row.title, text, picked.kind)
    const generatedAt = new Date().toISOString()
    updateVote.run(summarySimplified, summaryDetail, row.id)
    upsertDecision.run(row.id, picked.drucksacheId, picked.pdfUrl, generatedAt, PROMPT_VERSION)
    const antraege = antragByDrucksache.all(picked.drucksacheId)
    if (antraege.length === 1) upsertAntragDescription.run(antraege[0].id, summarySimplified, summaryDetail, row.id, picked.pdfUrl, generatedAt, PROMPT_VERSION)
    counts[picked.kind] = (counts[picked.kind] ?? 0) + 1
    const total = counts.antrag + counts.petitionen + counts.wahleinspruch + counts.verordnung
    if (total % 5 === 0) console.log(`  ${total}/${candidates.length - skippedNoPdf} done`)
  } catch (e) {
    llmFailure++
    console.warn(`x ${row.id} LLM failed (${picked.drucksacheId}, ${picked.kind}): ${e.message}`)
  }
}

await Promise.all(candidates.map((row) => limit(() => processVote(row))))

console.log(`done. total=${candidates.length} skipped_no_pdf=${skippedNoPdf} llm_failure=${llmFailure}`)
console.log(`  by kind: antrag=${counts.antrag} petitionen=${counts.petitionen} wahleinspruch=${counts.wahleinspruch} verordnung=${counts.verordnung}`)
db.close()

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
