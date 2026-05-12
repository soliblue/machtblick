import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'

const MEMBER = 'foullong-uwe'
const VALID_TO = '2025-07-10'

const db = new Database(fileURLToPath(new URL('./machtblick.sqlite', import.meta.url)))
const updated = db.prepare(`UPDATE member_affiliations SET valid_to = ? WHERE member_id = ? AND valid_to IS NULL`).run(VALID_TO, MEMBER).changes
const rows = db.prepare(`SELECT id, party, valid_from, valid_to FROM member_affiliations WHERE member_id = ?`).all(MEMBER)
console.log(`Closed ${updated} open affiliation row(s) for ${MEMBER} at ${VALID_TO}. Current rows:`, rows)
db.close()
