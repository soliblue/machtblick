import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'

const db = new Database(fileURLToPath(new URL('./machtblick.sqlite', import.meta.url)))

const replacements: Record<string, string> = {
  'Fraktion der CDU/CSU': 'CDU/CSU',
  'Fraktion der SPD': 'SPD',
  'Fraktion der AfD': 'AfD',
  'Fraktion BÜNDNIS 90/DIE GRÜNEN': 'B90/Grüne',
  'Fraktion DIE LINKE': 'Die Linke',
  'Bundesministerium der Finanzen': 'Bundesregierung',
  'Bundesministerium für Wirtschaft und Energie': 'Bundesregierung',
}

const rows = db.prepare('SELECT id, initiative_fraktion FROM antraege WHERE initiative_fraktion IS NOT NULL').all() as Array<{ id: number; initiative_fraktion: string }>
const update = db.prepare('UPDATE antraege SET initiative_fraktion = ? WHERE id = ?')
let changed = 0

for (const row of rows) {
  const normalized = row.initiative_fraktion.split(',').map((part) => replacements[part.trim()] ?? part.trim()).filter(Boolean).join(', ')
  if (normalized !== row.initiative_fraktion) {
    update.run(normalized, row.id)
    changed++
  }
}

console.log(`Normalized ${changed} Antrag initiative rows.`)
db.close()
