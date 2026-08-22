import Database from 'better-sqlite3'
import { XMLParser } from 'fast-xml-parser'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { rosterGapEnd } from './rosterGapEnd.ts'

const TERM = 21
const db = new Database(fileURLToPath(new URL('./machtblick.sqlite', import.meta.url)))
const xmlPath = fileURLToPath(new URL('../etl/bundestag-stammdaten/raw/MDB_STAMMDATEN.XML', import.meta.url))

type WpXml = { WP: string | number; MDBWP_BIS?: string }
type MdbXml = { ID: string | number; WAHLPERIODEN: { WAHLPERIODE: WpXml | WpXml[] } }

function toIso(germanDate: string) {
  const [d, m, y] = germanDate.split('.')
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

const endByMdbId = new Map<string, string>()
if (existsSync(xmlPath)) {
  const tree = new XMLParser({ ignoreAttributes: false }).parse(readFileSync(xmlPath, 'utf8')) as { DOCUMENT: { MDB: MdbXml[] } }
  for (const m of tree.DOCUMENT.MDB) {
    const wps = Array.isArray(m.WAHLPERIODEN.WAHLPERIODE) ? m.WAHLPERIODEN.WAHLPERIODE : [m.WAHLPERIODEN.WAHLPERIODE]
    const wp = wps.find((w) => String(w.WP) === String(TERM))
    if (wp?.MDBWP_BIS) endByMdbId.set(String(m.ID).padStart(8, '0'), toIso(String(wp.MDBWP_BIS)))
  }
} else {
  console.log(`warn: ${xmlPath} missing, Stammdaten pass skipped`)
}

const rosterDates = (db.prepare(
  `SELECT DISTINCT date FROM votes WHERE term_id = ? AND vote_type = 'namentlich' ORDER BY date DESC LIMIT 2`,
).all(TERM) as Array<{ date: string }>).map((r) => r.date)
const awEndByMember = new Map(
  (db.prepare(
    `SELECT mm.member_id AS id, MAX(mm.valid_to) AS endDate
     FROM member_mandates mm
     WHERE mm.term_id = ? AND mm.valid_to IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM member_mandates current
         WHERE current.term_id = mm.term_id AND current.member_id = mm.member_id AND current.valid_to IS NULL
       )
     GROUP BY mm.member_id`,
  ).all(TERM) as Array<{ id: string; endDate: string }>).map((row) => [row.id, row.endDate]),
)
const openMandateFromByMember = new Map(
  (db.prepare(
    `SELECT member_id AS id, MAX(valid_from) AS validFrom
     FROM member_mandates
     WHERE term_id = ? AND valid_to IS NULL
     GROUP BY member_id`,
  ).all(TERM) as Array<{ id: string; validFrom: string }>).map((row) => [row.id, row.validFrom]),
)
const roster = new Set(
  (db.prepare(
    `SELECT DISTINCT vm.member_id AS id FROM vote_members vm JOIN votes v ON v.id = vm.vote_id
     WHERE v.term_id = ? AND v.vote_type = 'namentlich' AND v.date IN (${rosterDates.map(() => '?').join(',')})`,
  ).all(TERM, ...rosterDates) as Array<{ id: string }>).map((r) => r.id),
)
const lastSeen = new Map(
  (db.prepare(
    `SELECT vm.member_id AS id, MAX(v.date) AS lastDate FROM vote_members vm JOIN votes v ON v.id = vm.vote_id
     WHERE v.term_id = ? AND v.vote_type = 'namentlich' GROUP BY vm.member_id`,
  ).all(TERM) as Array<{ id: string; lastDate: string }>).map((r) => [r.id, r.lastDate]),
)

const affRows = db.prepare(
  `SELECT a.id, a.member_id AS memberId, a.party, a.valid_from AS validFrom, a.valid_to AS validTo, m.bt_mdb_id AS btMdbId
   FROM member_affiliations a JOIN members m ON m.id = a.member_id WHERE a.term_id = ?`,
).all(TERM) as Array<{ id: number; memberId: string; party: string; validFrom: string; validTo: string | null; btMdbId: string | null }>

const byMember = new Map<string, typeof affRows>()
for (const r of affRows) byMember.set(r.memberId, [...(byMember.get(r.memberId) ?? []), r])

const setValidTo = db.prepare(`UPDATE member_affiliations SET valid_to = ? WHERE id = ?`)
let closedStammdaten = 0
let closedAw = 0
let closedRosterGap = 0
let corrected = 0

for (const [memberId, rows] of byMember) {
  const stammEnd = rows[0].btMdbId ? endByMdbId.get(rows[0].btMdbId) : undefined
  const awEnd = awEndByMember.get(memberId)
  const seen = lastSeen.get(memberId)
  const rosterEnd = rosterGapEnd(rosterDates.length === 2, seen, roster.has(memberId), openMandateFromByMember.get(memberId))
  const endDate = stammEnd ?? awEnd ?? rosterEnd
  if (!endDate) continue
  const lastRun = rows.reduce((a, b) => (b.validFrom > a.validFrom ? b : a))
  for (const r of rows) {
    const target = r.validTo === null || ((stammEnd || awEnd) && r.id === lastRun.id && r.validTo !== endDate)
    if (!target) continue
    if (endDate < r.validFrom) {
      console.log(`warn: ${memberId} end ${endDate} before valid_from ${r.validFrom}, skipped row ${r.id}`)
      continue
    }
    setValidTo.run(endDate, r.id)
    if (r.validTo === null) stammEnd ? closedStammdaten++ : awEnd ? closedAw++ : closedRosterGap++
    else corrected++
    console.log(`closed ${memberId} (${r.party}) at ${endDate} [${stammEnd ? 'stammdaten' : awEnd ? 'abgeordnetenwatch' : 'roster-gap'}]`)
  }
}

const sitting = (db.prepare(
  `SELECT COUNT(DISTINCT a.member_id) AS n FROM member_affiliations a
   WHERE a.term_id = ? AND a.valid_to IS NULL`,
).get(TERM) as { n: number }).n

console.log(`closed ${closedStammdaten} via Stammdaten MDBWP_BIS, ${closedAw} via abgeordnetenwatch, ${closedRosterGap} via roster gap, corrected ${corrected}; sitting members now ${sitting}`)
db.close()
