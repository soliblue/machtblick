import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { parseProposingParty } from '../../polarity/proposer.mjs'
import { extractInitiatorClause } from './extract.mjs'

const db = new Database(fileURLToPath(new URL('../../../../db/machtblick.sqlite', import.meta.url)))
const rows = db.prepare(`SELECT id, document, title, is_petition_bundle, procedural FROM votes`).all()
const update = db.prepare(`UPDATE votes SET initiator = ? WHERE id = ?`)

let xmlHits = 0
let teaserHits = 0
let nulls = 0
let petitionBundles = 0
let procedurals = 0
const fallbacks = []

const tx = db.transaction(() => {
  for (const v of rows) {
    if (v.is_petition_bundle) {
      update.run(null, v.id)
      petitionBundles++
      continue
    }
    if (v.procedural) {
      update.run(null, v.id)
      procedurals++
      continue
    }
    const clause = extractInitiatorClause(v.id, v.document, v.title)
    const fromXml = clause ? parseProposingParty(clause) : null
    if (fromXml) {
      update.run(fromXml, v.id)
      xmlHits++
      continue
    }
    const fromTeaser = parseProposingParty(v.document)
    if (fromTeaser) {
      update.run(fromTeaser, v.id)
      teaserHits++
      fallbacks.push(v.id)
      continue
    }
    update.run(null, v.id)
    nulls++
  }
})
tx()

console.log(`xml=${xmlHits} teaser=${teaserHits} null=${nulls} petitionBundles=${petitionBundles} procedurals=${procedurals} total=${rows.length}`)
if (process.argv.includes('--verbose')) {
  console.log('teaser fallbacks:')
  for (const id of fallbacks) console.log('  ' + id)
}
db.close()
