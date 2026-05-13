import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'

const db = new Database(fileURLToPath(new URL('../../../../db/machtblick.sqlite', import.meta.url)))

const PATTERNS = [
  'Federführung%',
  'Überweisung%',
  'Ausschussüberweisung%',
  'Überweisungsvorschlag%',
  'Erneute Überweisung%',
  'Wahl %',
  'Wahl der%',
  'Wahl von%',
  'Wahl Stiftungsrat%',
  'Wahl Kuratorium%',
  'Bestellung %',
  'Benennung %',
  'Abberufung %',
  'Genehmigung zur Durchführung eines Strafverfahrens%',
  'Genehmigung zur Durchführung eines Ermittlungsverfahrens%',
  'Genehmigung der Durchführung eines Strafverfahrens%',
  'Aufhebung der Immunität%',
  'Immunität %',
]

const placeholders = PATTERNS.map(() => 'title LIKE ?').join(' OR ')
const result = db.prepare(`UPDATE votes SET procedural = 1 WHERE procedural = 0 AND (${placeholders})`).run(...PATTERNS)
console.log(`procedural: flagged ${result.changes} additional row(s)`)
db.close()
