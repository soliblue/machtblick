import Database from 'better-sqlite3'
import { XMLParser } from 'fast-xml-parser'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const db = new Database(fileURLToPath(new URL('./machtblick.sqlite', import.meta.url)))
const stammdatenPath = fileURLToPath(new URL('../etl/bundestag-stammdaten/raw/MDB_STAMMDATEN.XML', import.meta.url))

const CODE_TO_STATE: Record<string, string> = {
  BW: 'Baden-Württemberg',
  BY: 'Bayern',
  BE: 'Berlin',
  BB: 'Brandenburg',
  HB: 'Bremen',
  HH: 'Hamburg',
  HE: 'Hessen',
  MV: 'Mecklenburg-Vorpommern',
  NI: 'Niedersachsen',
  NW: 'Nordrhein-Westfalen',
  RP: 'Rheinland-Pfalz',
  SL: 'Saarland',
  SN: 'Sachsen',
  ST: 'Sachsen-Anhalt',
  SH: 'Schleswig-Holstein',
  TH: 'Thüringen',
}

const WAHLKREIS_RANGES: Array<[number, number, string]> = [
  [1, 11, 'Schleswig-Holstein'],
  [12, 17, 'Mecklenburg-Vorpommern'],
  [18, 23, 'Hamburg'],
  [24, 53, 'Niedersachsen'],
  [54, 55, 'Bremen'],
  [56, 65, 'Brandenburg'],
  [66, 74, 'Sachsen-Anhalt'],
  [75, 86, 'Berlin'],
  [87, 150, 'Nordrhein-Westfalen'],
  [151, 166, 'Sachsen'],
  [167, 188, 'Hessen'],
  [189, 196, 'Thüringen'],
  [197, 211, 'Rheinland-Pfalz'],
  [212, 257, 'Bayern'],
  [258, 295, 'Baden-Württemberg'],
  [296, 299, 'Saarland'],
]

function asArray<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value : value ? [value] : []
}

const stammdatenState = new Map<string, string>()
if (existsSync(stammdatenPath)) {
  const tree = new XMLParser({ ignoreAttributes: false }).parse(readFileSync(stammdatenPath, 'utf8')) as {
    DOCUMENT: { MDB: Array<{ ID: string | number; WAHLPERIODEN: { WAHLPERIODE: unknown } }> }
  }
  for (const mdb of asArray(tree.DOCUMENT.MDB)) {
    for (const wp of asArray(mdb.WAHLPERIODEN.WAHLPERIODE) as Array<{ WP: string | number; LISTE?: string; WKR_LAND?: string }>) {
      if (Number(wp.WP) !== 21) continue
      const state = CODE_TO_STATE[String(wp.LISTE ?? '')] ?? CODE_TO_STATE[String(wp.WKR_LAND ?? '')]
      if (state) stammdatenState.set(String(mdb.ID).padStart(8, '0'), state)
    }
  }
}

const voteState = new Map<string, string>()
for (const row of db.prepare(`
  SELECT vm.member_id AS id, vm.state, COUNT(*) AS n FROM vote_members vm
  JOIN votes v ON v.id = vm.vote_id
  WHERE v.term_id = 21 AND vm.state != ''
  GROUP BY vm.member_id, vm.state ORDER BY n
`).all() as Array<{ id: string; state: string }>) voteState.set(row.id, row.state)

const listState = new Map<string, string>()
for (const row of db.prepare("SELECT id, list_state AS state FROM members WHERE list_state IS NOT NULL AND list_state != ''").all() as Array<{ id: string; state: string }>) listState.set(row.id, row.state)

const mandateState = new Map<string, string>()
for (const row of db.prepare('SELECT member_id AS id, list_state AS state FROM member_mandates WHERE term_id = 21 AND list_state IS NOT NULL').all() as Array<{ id: string; state: string }>) mandateState.set(row.id, row.state)

const mdbIdByMember = new Map<string, string>()
for (const row of db.prepare('SELECT id, bt_mdb_id AS mdb FROM members WHERE bt_mdb_id IS NOT NULL').all() as Array<{ id: string; mdb: string }>) mdbIdByMember.set(row.id, row.mdb)

const constituencyState = new Map<string, string>()
for (const row of db.prepare('SELECT member_id AS id, constituency_number AS wkr FROM member_mandates WHERE term_id = 21 AND constituency_number IS NOT NULL').all() as Array<{ id: string; wkr: string }>) {
  const state = WAHLKREIS_RANGES.find(([lo, hi]) => Number(row.wkr) >= lo && Number(row.wkr) <= hi)?.[2]
  if (state) constituencyState.set(row.id, state)
}

function stateFor(memberId: string) {
  return voteState.get(memberId)
    ?? listState.get(memberId)
    ?? mandateState.get(memberId)
    ?? stammdatenState.get(mdbIdByMember.get(memberId) ?? '')
    ?? constituencyState.get(memberId)
    ?? null
}

const emptyBallots = db.prepare("SELECT DISTINCT member_id AS id FROM vote_members WHERE state = ''").all() as Array<{ id: string }>
const updateBallots = db.prepare("UPDATE vote_members SET state = ? WHERE member_id = ? AND state = ''")
const updateMember = db.prepare("UPDATE members SET list_state = ? WHERE id = ? AND (list_state IS NULL OR list_state = '')")

db.exec('BEGIN')
let ballotsFilled = 0
const unresolved: string[] = []
for (const { id } of emptyBallots) {
  const state = stateFor(id)
  if (!state) {
    unresolved.push(id)
    continue
  }
  ballotsFilled += updateBallots.run(state, id).changes
}
let membersFilled = 0
for (const { id } of db.prepare('SELECT DISTINCT member_id AS id FROM member_mandates WHERE term_id = 21').all() as Array<{ id: string }>) {
  const state = stateFor(id)
  if (state) membersFilled += updateMember.run(state, id).changes
}
db.exec('COMMIT')

const unresolvedTerm21 = (db.prepare("SELECT COUNT(DISTINCT vm.member_id) AS n FROM vote_members vm JOIN votes v ON v.id = vm.vote_id WHERE v.term_id = 21 AND vm.state = ''").get() as { n: number }).n
console.log(`filled state on ballots of ${emptyBallots.length - unresolved.length}/${emptyBallots.length} members (${ballotsFilled} rows), members.list_state filled on ${membersFilled} rows, ${unresolved.length} members without any state source (pre-term-21 ballots)`)
if (unresolvedTerm21) console.log(`WARNING: ${unresolvedTerm21} term-21 members still lack state`)
db.close()
