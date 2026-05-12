import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'

const CANONICAL = 'kempf-martina'
const DUPLICATE = 'kempf-martina-rose-marie'

const db = new Database(fileURLToPath(new URL('./machtblick.sqlite', import.meta.url)))

const exists = db.prepare(`SELECT id FROM members WHERE id = ?`).get(DUPLICATE)
if (!exists) {
  console.log(`No duplicate ${DUPLICATE} present — nothing to do.`)
  db.close()
  process.exit(0)
}

db.exec('BEGIN')
const moved = db.prepare(`UPDATE vote_members SET member_id = ? WHERE member_id = ?`).run(CANONICAL, DUPLICATE).changes
const affDeleted = db.prepare(`DELETE FROM member_affiliations WHERE member_id = ?`).run(DUPLICATE).changes
const memDeleted = db.prepare(`DELETE FROM members WHERE id = ?`).run(DUPLICATE).changes
db.exec('COMMIT')

const total = db.prepare(`SELECT COUNT(*) as n FROM vote_members WHERE member_id = ?`).get(CANONICAL) as { n: number }
console.log(`Merged ${DUPLICATE} → ${CANONICAL}: ${moved} vote_members reassigned, ${affDeleted} affiliation row(s) deleted, ${memDeleted} member row deleted. ${CANONICAL} now has ${total.n} vote_members rows.`)
db.close()
