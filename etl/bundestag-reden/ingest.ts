import { DuckDBInstance } from '@duckdb/node-api'
import { sql } from 'drizzle-orm'
import { db } from '@machtblick/db/client'
import { speeches, members, votes } from '@machtblick/db/schema'

const PARQUET = new URL('./raw/CPP-BT_2026-01-17_DE_PQT_Reden_Gesamt.parquet', import.meta.url).pathname
const PERIOD_WP = 21
const HONORIFICS = new Set(['dr', 'prof', 'med', 'hc', 'h', 'c', 'dent', 'rer', 'nat', 'phil', 'jur', 'ing', 'mult', 'habil', 'mag', 'lic', 'theol', 'dipl', 'pol'])

const instance = await DuckDBInstance.create(':memory:')
const conn = await instance.connect()

const reader = await conn.runAndReadAll(`
  SELECT
    rede_id,
    sitzung_nr,
    CAST(sitzung_datum AS VARCHAR) AS sitzung_datum,
    redner_id,
    redner_titel,
    redner_vorname,
    redner_nachname,
    redner_namenszusatz,
    redner_fraktion,
    redner_rolle_kurz,
    redner_rolle_lang,
    rede_text,
    tokens,
    protokoll_nr
  FROM read_parquet('${PARQUET}')
  WHERE wahlperiode = ${PERIOD_WP}
  ORDER BY sitzung_nr ASC, rede_id ASC
`)
const rows = reader.getRowObjects()

const membersByKey = new Map<string, string>()
for (const m of db.select({ id: members.id, name: members.name, firstName: members.firstName, lastName: members.lastName }).from(members).all()) {
  membersByKey.set(nameKey(m.firstName, m.lastName), m.id)
}

const votesBySession = new Map<string, { id: string; date: string }[]>()
const votesByDate = new Map<string, { id: string; date: string }[]>()
for (const v of db.select({ id: votes.id, date: votes.date }).from(votes).all()) {
  if (v.date < '2025-03-25') continue
  const m = v.id.match(/^pp21-(\d+)-/)
  if (m) {
    const k = `21-${m[1]}`
    const arr = votesBySession.get(k) ?? []
    arr.push(v)
    votesBySession.set(k, arr)
  }
  const dateArr = votesByDate.get(v.date) ?? []
  dateArr.push(v)
  votesByDate.set(v.date, dateArr)
}

const positionPerSession = new Map<string, number>()
const inserts: typeof speeches.$inferInsert[] = []
const unmatchedSpeakers = new Map<string, number>()
let matchedMember = 0
let matchedVote = 0

for (const r of rows) {
  const sitzungNr = Number(r.sitzung_nr)
  const sessionId = `21-${sitzungNr}`
  const date = String(r.sitzung_datum)
  const position = (positionPerSession.get(sessionId) ?? 0) + 1
  positionPerSession.set(sessionId, position)

  const firstName = dedupeRepeat((r.redner_vorname as string | null) ?? '')
  const lastName = dedupeRepeat((r.redner_nachname as string | null) ?? '')
  const titel = (r.redner_titel as string | null) ?? ''
  const namenszusatz = (r.redner_namenszusatz as string | null) ?? ''
  const speakerName = [titel, firstName, lastName, namenszusatz].filter(Boolean).join(' ').trim()

  const roleLang = (r.redner_rolle_lang as string | null) ?? null
  const roleKurz = (r.redner_rolle_kurz as string | null) ?? null
  const speakerRole = roleLang ?? roleKurz
  const party = (r.redner_fraktion as string | null) ?? null

  const speakerMemberId = speakerRole == null ? membersByKey.get(nameKey(firstName, lastName)) ?? null : null
  if (speakerMemberId) matchedMember++
  else if (!speakerRole) {
    const key = `${lastName}, ${firstName}`
    unmatchedSpeakers.set(key, (unmatchedSpeakers.get(key) ?? 0) + 1)
  }

  const voteId = resolveVoteId(sessionId, date)
  if (voteId) matchedVote++

  const text = (r.rede_text as string | null) ?? ''
  const excerpt = text.slice(0, 280)
  const wordCount = r.tokens != null ? Math.round(Number(r.tokens)) : text.split(/\s+/).filter(Boolean).length
  const protokollNr = (r.protokoll_nr as string | null) ?? `21/${sitzungNr}`
  const padded = String(sitzungNr).padStart(5, '0')
  const sourceUrl = `https://dserver.bundestag.de/btp/21/21${padded}.pdf`

  inserts.push({
    id: String(r.rede_id),
    sessionId,
    agendaItem: null,
    voteId,
    speakerMemberId,
    speakerName,
    speakerRole,
    party,
    date,
    position,
    textExcerpt: excerpt,
    textFull: text,
    wordCount,
    sourceUrl,
  })
}

const dbChanges = db.transaction((tx) => {
  let n = 0
  for (const row of inserts) {
    const r = tx.insert(speeches).values(row).onConflictDoUpdate({
      target: speeches.id,
      set: {
        sessionId: row.sessionId,
        agendaItem: row.agendaItem,
        voteId: row.voteId,
        speakerMemberId: row.speakerMemberId,
        speakerName: row.speakerName,
        speakerRole: row.speakerRole,
        party: row.party,
        date: row.date,
        position: row.position,
        textExcerpt: row.textExcerpt,
        textFull: row.textFull,
        wordCount: row.wordCount,
        sourceUrl: row.sourceUrl,
      },
    }).run()
    n += r.changes
  }
  return n
})

const byFraktion = new Map<string, number>()
for (const r of inserts) {
  const k = r.party ?? (r.speakerRole ? `[Rolle: ${r.speakerRole.split(' ')[0]}]` : '[unbekannt]')
  byFraktion.set(k, (byFraktion.get(k) ?? 0) + 1)
}

const votesCovered = new Set(inserts.map((s) => s.voteId).filter(Boolean) as string[])
const totalVotes21BT = db.select({ c: sql<number>`count(*)` }).from(votes).where(sql`${votes.date} >= '2025-03-25'`).all()[0].c

console.log(`speeches ingested: ${inserts.length} (db changes: ${dbChanges})`)
console.log(`\nper fraktion / rolle:`)
for (const [k, n] of [...byFraktion.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(36)} ${String(n).padStart(5)}`)
}
console.log(`\nvote linkage: ${matchedVote}/${inserts.length} speeches got a vote_id`)
console.log(`distinct votes with >=1 speech: ${votesCovered.size}/${totalVotes21BT}`)
console.log(`\nspeaker linkage: matched=${matchedMember}, role-based=${inserts.filter((s) => s.speakerRole).length}, unmatched=${inserts.length - matchedMember - inserts.filter((s) => s.speakerRole).length}`)
console.log(`\ntop 15 unmatched non-role speakers:`)
for (const [k, n] of [...unmatchedSpeakers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${k.padEnd(36)} ${n}`)
}

function dedupeRepeat(s: string) {
  const n = s.length
  return n > 1 && n % 2 === 0 && s.slice(0, n / 2) === s.slice(n / 2) ? s.slice(0, n / 2) : s
}

function nameKey(first: string, last: string) {
  return strip(`${first} ${last}`)
}

function strip(s: string) {
  const ascii = s.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
  return ascii.split(' ').filter((t) => t && !HONORIFICS.has(t)).join(' ')
}

function resolveVoteId(sessionId: string, date: string) {
  const sess = votesBySession.get(sessionId)
  if (sess && sess.length === 1) return sess[0].id
  const byDate = votesByDate.get(date)
  if (byDate && byDate.length === 1) return byDate[0].id
  return null
}
