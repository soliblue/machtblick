import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'

const FRAKTIONEN = ['CDU/CSU', 'B90/Grüne', 'Die Linke', 'AfD', 'SPD', 'FDP', 'BSW']

const SUSPICIOUS_TITLE_PATTERNS = [
  /Genehmigung\s+(?:zur|der)\s+Durchführung\s+eines?\s+(?:Straf|Ermittlungs)verfahrens/i,
  /Aufhebung\s+der\s+Immunität/i,
  /\bImmunität\b.*\b(?:aufheben|aufgehoben)\b/i,
  /^Wahl\s/i,
  /^Bestellung\s/i,
  /^Benennung\s/i,
  /^Abberufung\s/i,
  /^Federführung\b/i,
  /^Überweisung\b/i,
  /^Ausschussüberweisung\b/i,
  /^Überweisungsvorschlag\b/i,
  /^Erneute\s+Überweisung\b/i,
]

const db = new Database(fileURLToPath(new URL('../../../../db/machtblick.sqlite', import.meta.url)))
const placeholders = FRAKTIONEN.map(() => '?').join(',')
const rows = db.prepare(`
  SELECT v.id, v.title, v.initiator, v.result
  FROM votes v
  WHERE v.procedural = 0
    AND v.inverted = 0
    AND v.initiator IN (${placeholders})
`).all(...FRAKTIONEN)

const hits = rows.filter((r) => SUSPICIOUS_TITLE_PATTERNS.some((re) => re.test(r.title)))

console.log(`suspicious-initiator audit: ${hits.length} hit(s)`)
for (const h of hits) console.log(`  ${h.id} initiator=${h.initiator} result=${h.result} title=${h.title}`)
db.close()
if (hits.length > 0) process.exitCode = 1
