import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { memberMandateIdAction, type MemberMandateIdRow } from './memberMandateId.ts'

type MandateRow = MemberMandateIdRow & { id: number }

const db = new Database(fileURLToPath(new URL('./machtblick.sqlite', import.meta.url)))
const rows = db.prepare(`
  SELECT mm.id, mm.term_id AS termId, mm.bt_mdb_id AS mandateBtMdbId,
    m.bt_mdb_id AS memberBtMdbId
  FROM member_mandates mm
  JOIN members m ON m.id = mm.member_id
  WHERE mm.term_id = 21 AND mm.bt_mdb_id IS NOT m.bt_mdb_id
`).all() as MandateRow[]
const conflicts = rows.filter((row) => memberMandateIdAction(row) === 'conflict')
assert.equal(conflicts.length, 0, `conflicting term-21 mandate Bundestag ids: ${conflicts.map((row) => row.id).join(', ')}`)
const targets = rows.filter((row) => memberMandateIdAction(row) === 'normalize')
const update = db.prepare(`
  UPDATE member_mandates SET bt_mdb_id = @memberBtMdbId
  WHERE id = @id AND term_id = 21 AND bt_mdb_id IS @mandateBtMdbId
`)
const changed = db.transaction((targetRows: MandateRow[]) => targetRows.reduce(
  (total, row) => total + update.run(row).changes,
  0,
))(targets)

assert.equal(changed, targets.length)
assert.equal((db.prepare(`
  SELECT mm.id, mm.term_id AS termId, mm.bt_mdb_id AS mandateBtMdbId,
    m.bt_mdb_id AS memberBtMdbId
  FROM member_mandates mm
  JOIN members m ON m.id = mm.member_id
  WHERE mm.term_id = 21 AND mm.bt_mdb_id IS NOT m.bt_mdb_id
`).all() as MandateRow[]).filter((row) => memberMandateIdAction(row) !== 'keep').length, 0)

console.log(`normalized ${changed} term-21 mandate Bundestag ids from canonical member ids`)
db.close()
