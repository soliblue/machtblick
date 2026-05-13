import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'

const FRAKTIONEN = ['CDU/CSU', 'B90/Grüne', 'Die Linke', 'AfD', 'SPD', 'FDP', 'BSW']

const db = new Database(fileURLToPath(new URL('../../../../db/machtblick.sqlite', import.meta.url)))
const placeholders = FRAKTIONEN.map(() => '?').join(',')
const hits = db.prepare(`
  SELECT v.id, v.initiator, v.procedural, v.inverted, v.result, v.title
  FROM votes v
  JOIN vote_party_summaries s ON s.vote_id = v.id AND s.party = v.initiator
  WHERE s.position = 'no'
    AND v.initiator IN (${placeholders})
    AND v.procedural = 0
    AND v.inverted = 0
`).all(...FRAKTIONEN)

console.log(`self-no audit: ${hits.length} hit(s)`)
for (const h of hits) console.log(`  ${h.id} initiator=${h.initiator} result=${h.result} title=${h.title}`)
db.close()
if (hits.length > 0) process.exitCode = 1
