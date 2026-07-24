import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { applyInversion, defectionSignature } from './apply.mjs'
import { pLimit } from './limit.mjs'
import { runPreprocessingCodex } from '../preprocessing/codex.mjs'
import { handzeichenSourceBlock } from '../handzeichen/source.mjs'

const FRAKTIONEN = new Set(['CDU/CSU', 'B90/Grüne', 'Die Linke', 'AfD', 'SPD', 'FDP', 'BSW'])

const db = new Database(fileURLToPath(new URL('../../../db/machtblick.sqlite', import.meta.url)))
const schemaPath = fileURLToPath(new URL('./output-schema-self-no.json', import.meta.url))

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
      .replace('__SOURCE_BLOCK__', handzeichenSourceBlock(row.id)?.slice(-6000) ?? '(nicht vorhanden)')
    const result = await runPreprocessingCodex({ prompt, schemaPath, tmpPrefix: 'machtblick-polarity-self-no-' })
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
