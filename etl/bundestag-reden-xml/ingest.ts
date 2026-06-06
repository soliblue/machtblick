import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { sql } from 'drizzle-orm'
import { db } from '@machtblick/db/client'
import { speechDebateGroupSpeeches, speeches, speechTranslations, speechVoteLinks, members, votes } from '@machtblick/db/schema'
import { parseProtocol, type SpeechRow } from './parse.ts'

const HONORIFICS = new Set(['dr', 'prof', 'med', 'hc', 'h', 'c', 'dent', 'rer', 'nat', 'phil', 'jur', 'ing', 'mult', 'habil', 'mag', 'lic', 'theol', 'dipl', 'pol'])
const rawDir = fileURLToPath(new URL('./raw/xml/', import.meta.url))

const membersByKey = new Map<string, string>()
const membersByMdbId = new Map<string, string>()
for (const m of db.select({ id: members.id, firstName: members.firstName, lastName: members.lastName, btMdbId: members.btMdbId }).from(members).all()) {
  membersByKey.set(nameKey(m.firstName, m.lastName), m.id)
  if (m.btMdbId) membersByMdbId.set(m.btMdbId, m.id)
}

const files = readdirSync(rawDir).filter((f) => f.endsWith('.xml')).sort()
const parsedProtocols: SpeechRow[][] = []
const sessionByDate = new Map<string, string>()
for (const file of files) {
  const xml = readFileSync(join(rawDir, file), 'utf8')
  const rows = parseProtocol(xml)
  parsedProtocols.push(rows)
  const first = rows[0]
  if (first) sessionByDate.set(first.date, first.sessionId)
}

const votesByTop = new Map<string, string[]>()
for (const v of db.select({ id: votes.id, date: votes.date, agendaItem: votes.agendaItem }).from(votes).all()) {
  if (v.date < '2025-03-25') continue
  const sessionId = sessionByDate.get(v.date) ?? null
  if (sessionId && v.agendaItem) {
    const k = `${sessionId}|${v.agendaItem}`
    const arr = votesByTop.get(k) ?? []
    arr.push(v.id)
    votesByTop.set(k, arr)
  }
}

const inserts: typeof speeches.$inferInsert[] = []
const unmatchedSpeakers = new Map<string, number>()
let matchedMember = 0
let matchedViaMdbId = 0
let matchedViaName = 0
let matchedVote = 0
let topPopulated = 0

for (const rows of parsedProtocols) {
  for (const r of rows) {
    const hasRole = r.speakerRoleLang || r.speakerRoleKurz
    const mdbHit = hasRole || !r.speakerDipId || r.speakerDipId.startsWith('999') ? null : membersByMdbId.get(r.speakerDipId) ?? null
    const nameHit = !mdbHit && !hasRole ? membersByKey.get(nameKey(r.speakerVorname, r.speakerNachname)) ?? null : null
    const memberId = mdbHit ?? nameHit
    if (mdbHit) matchedViaMdbId++
    if (nameHit) matchedViaName++
    if (memberId) matchedMember++
    else if (!hasRole) {
      const key = `${r.speakerNachname}, ${r.speakerVorname}`
      unmatchedSpeakers.set(key, (unmatchedSpeakers.get(key) ?? 0) + 1)
    }

    const voteId = resolveVoteId(r.sessionId, r.agendaItem)
    if (voteId) matchedVote++
    if (r.agendaItem) topPopulated++

    const text = r.textFull
    inserts.push({
      id: r.id,
      sessionId: r.sessionId,
      agendaItem: r.agendaItem,
      voteId,
      speakerMemberId: memberId,
      speakerName: r.speakerName,
      speakerRole: r.speakerRoleLang ?? r.speakerRoleKurz ?? null,
      party: r.speakerFraktion,
      date: r.date,
      position: r.position,
      textExcerpt: text.slice(0, 280),
      textFull: text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      sourceUrl: r.sourceUrl,
    })
  }
}

const sessionsCovered = [...new Set(inserts.map((r) => r.sessionId))]
const sessionSql = sql.join(sessionsCovered.map((sessionId) => sql`${sessionId}`), sql`, `)
const dbChanges = db.transaction((tx) => {
  let n = 0
  n += tx.run(sql`DELETE FROM ${speechTranslations} WHERE ${speechTranslations.speechId} IN (SELECT ${speeches.id} FROM ${speeches} WHERE ${speeches.sessionId} IN (${sessionSql}) AND ${speeches.sourceUrl} NOT LIKE '%.xml')`).changes
  n += tx.run(sql`DELETE FROM ${speechDebateGroupSpeeches} WHERE ${speechDebateGroupSpeeches.speechId} IN (SELECT ${speeches.id} FROM ${speeches} WHERE ${speeches.sessionId} IN (${sessionSql}) AND ${speeches.sourceUrl} NOT LIKE '%.xml')`).changes
  n += tx.run(sql`DELETE FROM ${speechVoteLinks} WHERE ${speechVoteLinks.speechId} IN (SELECT ${speeches.id} FROM ${speeches} WHERE ${speeches.sessionId} IN (${sessionSql}) AND ${speeches.sourceUrl} NOT LIKE '%.xml')`).changes
  n += tx.run(sql`DELETE FROM ${speeches} WHERE ${speeches.sessionId} IN (${sessionSql}) AND ${speeches.sourceUrl} NOT LIKE '%.xml'`).changes
  for (const row of inserts) {
    const r = tx.insert(speeches).values(row).onConflictDoUpdate({ target: speeches.id, set: row }).run()
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
const sessionsParsed = new Set(inserts.map((s) => s.sessionId)).size

console.log(`speeches ingested: ${inserts.length} (db changes: ${dbChanges}) from ${files.length} sessions (parsed: ${sessionsParsed})`)
console.log(`\nper fraktion / rolle:`)
for (const [k, n] of [...byFraktion.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(36)} ${String(n).padStart(5)}`)
}
console.log(`\nagenda_item populated: ${topPopulated}/${inserts.length}`)
console.log(`vote linkage: ${matchedVote}/${inserts.length} speeches got a vote_id`)
console.log(`distinct votes with >=1 speech: ${votesCovered.size}/${totalVotes21BT}`)
console.log(`speaker linkage: matched=${matchedMember} (via mdb_id=${matchedViaMdbId}, via name=${matchedViaName}), role-based=${inserts.filter((s) => s.speakerRole).length}, unmatched=${inserts.length - matchedMember - inserts.filter((s) => s.speakerRole).length}`)
console.log(`\ntop 15 unmatched non-role speakers:`)
for (const [k, n] of [...unmatchedSpeakers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${k.padEnd(36)} ${n}`)
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

function resolveVoteId(sessionId: string, agendaItem: string | null) {
  if (agendaItem) {
    const top = votesByTop.get(`${sessionId}|${agendaItem}`)
    if (top && top.length === 1) return top[0]
  }
  return null
}
