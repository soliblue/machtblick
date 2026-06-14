import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { substantiveResultFromSummaries } from '../etl/bundestag/polarity/apply.mjs'

const db = new Database(fileURLToPath(new URL('./machtblick.sqlite', import.meta.url)))

const stranded = db.prepare(`
  SELECT v.id, v.result
  FROM votes v
  JOIN vote_party_summaries s ON s.vote_id = v.id AND s.party = v.initiator
  WHERE v.inverted = 1 AND v.procedural = 0 AND v.vote_type = 'handzeichen' AND s.position = 'no'
`).all() as Array<{ id: string; result: string }>

const flip = db.prepare(`
  UPDATE vote_party_summaries
  SET position = CASE position WHEN 'yes' THEN 'no' WHEN 'no' THEN 'yes' ELSE position END
  WHERE vote_id = ?
`)
const setResult = db.prepare(`UPDATE votes SET result = ? WHERE id = ?`)

const repair = db.transaction(() => {
  const changes: Array<{ id: string; from: string; to: string }> = []
  for (const v of stranded) {
    flip.run(v.id)
    const result = substantiveResultFromSummaries(db, v.id)
    setResult.run(result, v.id)
    changes.push({ id: v.id, from: v.result, to: result })
  }
  return changes
})

const changes = repair()
console.log(`repaired ${changes.length} inverted handzeichen votes (re-flipped positions, recomputed result)`)
for (const c of changes) console.log(`  ${c.id}: result ${c.from} → ${c.to}`)
db.close()
