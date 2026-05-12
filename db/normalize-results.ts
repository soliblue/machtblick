import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'

const PARTY_PATTERNS: Array<[RegExp, string]> = [
  [/CDU\s*\/\s*CSU/i, 'CDU/CSU'],
  [/B(?:Ü|UE|U)NDNIS\s*90\s*\/\s*DIE\s*GR(?:Ü|UE|U)NEN/i, 'B90/Grüne'],
  [/B(?:ü|u)ndnis\s*90\s*\/\s*Die\s*Gr(?:ü|u)nen/i, 'B90/Grüne'],
  [/Die\s*Linke/i, 'Die Linke'],
  [/\bAfD\b/, 'AfD'],
  [/\bSPD\b/, 'SPD'],
  [/\bFDP\b/, 'FDP'],
  [/\bBSW\b/, 'BSW'],
]

function matchParty(text: string): string | null {
  for (const [re, party] of PARTY_PATTERNS) if (re.test(text)) return party
  return null
}

function parseProposingParty(document: string | null): string | null {
  if (!document) return null
  const fraktion = document.match(/Fraktion(?:en)?\s+(?:der\s+|des\s+)?([^()]+?)(?:[:,(]|$|\s+(?:zu|zum|zur|Entwurf|Drucksache))/i)
  if (fraktion) {
    const m = matchParty(fraktion[1])
    if (m) return m
  }
  if (/(?:Antrag|Gesetzentwurf)(?:es)?\s+der\s+Bundesregierung/i.test(document)) return 'Bundesregierung'
  if (/(?:Antrag|Gesetzentwurf)(?:es)?\s+des\s+Bundesrates/i.test(document)) return 'Bundesrat'
  return matchParty(document)
}

const db = new Database(fileURLToPath(new URL('./machtblick.sqlite', import.meta.url)))
const candidates = db.prepare(`SELECT id, document FROM votes WHERE procedural = 0 AND result = 'angenommen'`).all() as Array<{ id: string; document: string | null }>
const getPosition = db.prepare(`SELECT position FROM vote_party_summaries WHERE vote_id = ? AND party = ?`)
const update = db.prepare(`UPDATE votes SET result = 'abgelehnt' WHERE id = ?`)

let flipped = 0
for (const v of candidates) {
  const party = parseProposingParty(v.document)
  if (!party) continue
  const row = getPosition.get(v.id, party) as { position: string } | undefined
  if (row?.position === 'no') {
    update.run(v.id)
    flipped++
  }
}
console.log(`Flipped ${flipped} votes from angenommen → abgelehnt (proposer voted no)`)
db.close()
