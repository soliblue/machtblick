import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { hasInvertedTitleShape, stripProceduralPrefix, extractDrucksachen, readDrucksacheCache, underlyingTitleFromCache } from './rule.mjs'
import { classifyWithLLM } from './llm.mjs'
import { applyInversion, recordNoInversion, defectionSignature } from './apply.mjs'
import { parseProposingParty } from './proposer.mjs'
import { pLimit } from './limit.mjs'

const DB_PATH = fileURLToPath(new URL('../../../db/machtblick.sqlite', import.meta.url))
const db = new Database(DB_PATH)

const candidates = db.prepare(`
  SELECT v.id, v.title, v.document, v.result, v.yes, v.no, v.vote_type
  FROM votes v
  LEFT JOIN vote_polarity_decisions d ON d.vote_id = v.id
  WHERE v.procedural = 0 AND v.inverted = 0 AND d.vote_id IS NULL
`).all()

console.log(`polarity: scanning ${candidates.length} unchecked votes`)

let rulePassHits = 0
let llmPassHits = 0
let llmLowSkipped = 0
let invertedCount = 0
let defectionMismatch = 0

async function ruleDecision(row) {
  if (!hasInvertedTitleShape(row.title)) return null
  const dnrs = extractDrucksachen(row.document)
  let underlying = null
  let drucksachetyp = null
  for (const d of dnrs) {
    const doc = await readDrucksacheCache(d)
    if (doc) {
      drucksachetyp = doc.drucksachetyp
      underlying = underlying ?? underlyingTitleFromCache(doc)
    }
  }
  const stripped = stripProceduralPrefix(row.title)
  const titleSignal = stripped != null
  const dipSignal = drucksachetyp === 'Beschlussempfehlung'
  if (titleSignal && dipSignal && underlying) {
    return { inverted: true, rewrittenTitle: underlying.slice(0, 200), source: 'rule', confidence: 'high', reason: 'title-pattern + DIP Beschlussempfehlung' }
  }
  if (titleSignal && dipSignal) {
    return { inverted: true, rewrittenTitle: stripped, source: 'rule', confidence: 'high', reason: 'title-pattern + DIP Beschlussempfehlung; rewritten via strip' }
  }
  return null
}

const llmCandidates = []
for (const row of candidates) {
  const decision = await ruleDecision(row)
  if (decision?.inverted) {
    rulePassHits++
    const before = defectionSignature(db, row.id)
    applyInversion(db, row, decision)
    invertedCount++
    const after = defectionSignature(db, row.id)
    if (before !== after) {
      defectionMismatch++
      console.warn(`⚠ defection signature changed for ${row.id}: ${before} → ${after}`)
    }
    continue
  }
  if (hasInvertedTitleShape(row.title) || /Beschlussempfehlung/i.test(row.title)) {
    llmCandidates.push(row)
  } else {
    recordNoInversion(db, row, { source: 'rule', confidence: 'high', reason: 'no inverted title shape' })
  }
}

console.log(`rule pass: ${rulePassHits} inverted, ${llmCandidates.length} → LLM`)

const limit = pLimit(4)
const tasks = llmCandidates.map((row) =>
  limit(async () => {
    const proposer = parseProposingParty(row.document)
    const result = await classifyWithLLM({ title: row.title, document: row.document, proposer })
    return { row, result }
  }),
)

const llmOutcomes = await Promise.all(tasks)
for (const { row, result } of llmOutcomes) {
  if (!result.inverted || result.confidence === 'low' || !result.rewrittenTitle) {
    if (result.confidence === 'low') llmLowSkipped++
    recordNoInversion(db, row, { source: 'llm', confidence: result.confidence, reason: result.reason })
    continue
  }
  llmPassHits++
  const before = defectionSignature(db, row.id)
  applyInversion(db, row, { rewrittenTitle: result.rewrittenTitle, source: 'llm', confidence: result.confidence, reason: result.reason })
  invertedCount++
  const after = defectionSignature(db, row.id)
  if (before !== after) {
    defectionMismatch++
    console.warn(`⚠ defection signature changed for ${row.id}: ${before} → ${after}`)
  }
}

console.log(`done. scanned=${candidates.length} rule_hits=${rulePassHits} llm_hits=${llmPassHits} llm_low_skipped=${llmLowSkipped} inverted_total=${invertedCount} defection_mismatch=${defectionMismatch}`)
db.close()
if (defectionMismatch > 0) process.exitCode = 1
