import Database from 'better-sqlite3'
import { pickAntragWithFallback } from './pickAntrag.mjs'
import { extractPdf } from './extractPdf.mjs'
import { generateDescriptions } from './llm.mjs'
import { PROMPT_VERSION } from './prompt.mjs'
import { pLimit } from '../polarity/limit.mjs'

const DB_PATH = '/Users/soli/machtblick/db/machtblick.sqlite'
const db = new Database(DB_PATH)

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

const counts = { antrag: 0, petitionen: 0, wahleinspruch: 0, verordnung: 0 }
let skippedNoPdf = 0
let llmFailure = 0

const limit = pLimit(4)

async function process(row) {
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
    updateVote.run(summarySimplified, summaryDetail, row.id)
    upsertDecision.run(row.id, picked.drucksacheId, picked.pdfUrl, new Date().toISOString(), PROMPT_VERSION)
    counts[picked.kind] = (counts[picked.kind] ?? 0) + 1
    const total = counts.antrag + counts.petitionen + counts.wahleinspruch + counts.verordnung
    if (total % 5 === 0) console.log(`  ${total}/${candidates.length - skippedNoPdf} done`)
  } catch (e) {
    llmFailure++
    console.warn(`x ${row.id} LLM failed (${picked.drucksacheId}, ${picked.kind}): ${e.message}`)
  }
}

await Promise.all(candidates.map((row) => limit(() => process(row))))

console.log(`done. total=${candidates.length} skipped_no_pdf=${skippedNoPdf} llm_failure=${llmFailure}`)
console.log(`  by kind: antrag=${counts.antrag} petitionen=${counts.petitionen} wahleinspruch=${counts.wahleinspruch} verordnung=${counts.verordnung}`)
db.close()
