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
  'Wahlvorschlag%',
  'Wahlvorschläge%',
  'Wahl Stiftungsrat%',
  'Wahl Kuratorium%',
  'Beschlussempfehlung des Wahlprüfungsausschusses%',
  '%Wahleinspruch%',
  '%Wahleinsprüch%',
  '%Einsprüche anlässlich der Wahl%',
  '%Einsprüchen gegen die Bundestagswahl%',
  'Bestellung %',
  'Benennung %',
  'Abberufung %',
  'Genehmigung zur Durchführung eines Strafverfahrens%',
  'Genehmigung zur Durchführung eines Ermittlungsverfahrens%',
  'Genehmigung der Durchführung eines Strafverfahrens%',
  'Aufhebung der Immunität%',
  'Immunität %',
  'Verfahrensbeteiligung BVerfG%',
  'Beschlussempfehlung zum Streitverfahren vor dem BVerfG%',
  'Normenkontrolle zum Bundeshaushalt%',
]

const placeholders = PATTERNS.map(() => 'title LIKE ? OR document LIKE ?').join(' OR ')
const params = PATTERNS.flatMap((pattern) => [pattern, pattern])
const result = db.prepare(`UPDATE votes SET procedural = 1 WHERE procedural = 0 AND (${placeholders})`).run(...params)
console.log(`procedural: flagged ${result.changes} additional row(s)`)
db.close()
