import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { normalizePartyList } from './partyPatterns'

const db = new Database(fileURLToPath(new URL('./machtblick.sqlite', import.meta.url)))

const rows = db.prepare('SELECT id, initiative_fraktion FROM antraege WHERE initiative_fraktion IS NOT NULL').all() as Array<{ id: number; initiative_fraktion: string }>
const update = db.prepare('UPDATE antraege SET initiative_fraktion = ? WHERE id = ?')
let changed = 0

for (const row of rows) {
  const normalized = normalizePartyList(row.initiative_fraktion)
  if (normalized !== row.initiative_fraktion) {
    update.run(normalized, row.id)
    changed++
  }
}

console.log(`Normalized ${changed} Antrag initiative rows.`)
db.close()
