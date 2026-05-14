import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { parseProposingParty } from './parseProposingParty'

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
