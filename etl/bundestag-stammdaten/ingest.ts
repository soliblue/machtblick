import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { XMLParser } from 'fast-xml-parser'
import { sql } from 'drizzle-orm'
import { db } from '@machtblick/db/client'
import { members } from '@machtblick/db/schema'

const HONORIFICS = new Set(['dr', 'prof', 'med', 'hc', 'h', 'c', 'dent', 'rer', 'nat', 'phil', 'jur', 'ing', 'mult', 'habil', 'mag', 'lic', 'theol', 'dipl', 'pol'])
const NAME_PARTICLES = new Set(['von', 'van', 'de', 'der', 'den', 'dos', 'da', 'di', 'du', 'le', 'la', 'zu', 'auf', 'freiherr', 'graf', 'edler', 'edle', 'baron', 'baronin'])
const xmlPath = fileURLToPath(new URL('./raw/MDB_STAMMDATEN.XML', import.meta.url))
const xml = readFileSync(xmlPath, 'utf8')

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', textNodeName: '_text' })
const tree = parser.parse(xml) as { DOCUMENT: { MDB: MdbXml[] } }
const allMdbs = Array.isArray(tree.DOCUMENT.MDB) ? tree.DOCUMENT.MDB : [tree.DOCUMENT.MDB]

type MdbXml = { ID: string | number; NAMEN: { NAME: NameXml | NameXml[] }; WAHLPERIODEN: { WAHLPERIODE: WpXml | WpXml[] } }
type NameXml = { NACHNAME: string; VORNAME: string }
type WpXml = { WP: string | number }

const wp21Feed = allMdbs.filter((m) => {
  const wps = Array.isArray(m.WAHLPERIODEN.WAHLPERIODE) ? m.WAHLPERIODEN.WAHLPERIODE : [m.WAHLPERIODEN.WAHLPERIODE]
  return wps.some((w) => String(w.WP) === '21')
})

const byKey = new Map<string, { id: string; first: string; last: string }[]>()
const byFirstTokenKey = new Map<string, { id: string; first: string; last: string }[]>()
for (const m of wp21Feed) {
  const id = String(m.ID).padStart(8, '0')
  const names = Array.isArray(m.NAMEN.NAME) ? m.NAMEN.NAME : [m.NAMEN.NAME]
  for (const n of names) {
    const entry = { id, first: n.VORNAME, last: n.NACHNAME }
    push(byKey, nameKey(n.VORNAME, n.NACHNAME), entry)
    push(byFirstTokenKey, nameKey(firstToken(n.VORNAME), n.NACHNAME), entry)
  }
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const arr = map.get(key) ?? []
  arr.push(value)
  map.set(key, arr)
}

function firstToken(s: string) {
  return s.split(/\s+/)[0] ?? ''
}

const ourMembers = db.select({ id: members.id, first: members.firstName, last: members.lastName, btMdbId: members.btMdbId }).from(members).all()

let matched = 0
let conflicts = 0
let alreadySet = 0
const unmatchedOurs: { id: string; first: string; last: string }[] = []
const matchedIds = new Set<string>()

db.transaction((tx) => {
  for (const m of ourMembers) {
    const hits = byKey.get(nameKey(m.first, m.last)) ?? byFirstTokenKey.get(nameKey(firstToken(m.first), m.last))
    if (!hits || hits.length === 0) {
      unmatchedOurs.push({ id: m.id, first: m.first, last: m.last })
      continue
    }
    const uniqueIds = [...new Set(hits.map((h) => h.id))]
    if (uniqueIds.length > 1) {
      conflicts++
      console.log(`conflict ${m.id} (${m.first} ${m.last}) → ${uniqueIds.join(', ')}`)
      continue
    }
    const btMdbId = uniqueIds[0]
    matchedIds.add(btMdbId)
    if (m.btMdbId === btMdbId) {
      alreadySet++
      continue
    }
    tx.update(members).set({ btMdbId }).where(sql`${members.id} = ${m.id}`).run()
    matched++
  }
})

const feedUnmatched = wp21Feed
  .map((m) => ({ id: String(m.ID).padStart(8, '0'), names: Array.isArray(m.NAMEN.NAME) ? m.NAMEN.NAME : [m.NAMEN.NAME] }))
  .filter((m) => !matchedIds.has(m.id))

console.log(`\nstammdaten ingest:`)
console.log(`  feed WP21 MdBs:           ${wp21Feed.length}`)
console.log(`  our members:              ${ourMembers.length}`)
console.log(`  matched (newly set):      ${matched}`)
console.log(`  matched (already set):    ${alreadySet}`)
console.log(`  conflicts (skipped):      ${conflicts}`)
console.log(`  unmatched our-side:       ${unmatchedOurs.length}`)
console.log(`  unmatched feed-side:      ${feedUnmatched.length}`)

if (unmatchedOurs.length) {
  console.log(`\nunmatched in our members table:`)
  for (const m of unmatchedOurs.slice(0, 20)) console.log(`  ${m.id.padEnd(34)} ${m.first} ${m.last}`)
  if (unmatchedOurs.length > 20) console.log(`  ... +${unmatchedOurs.length - 20} more`)
}

if (feedUnmatched.length) {
  console.log(`\nfeed MdBs with no match in our members (Nachrücker not yet ingested or true gaps):`)
  for (const m of feedUnmatched.slice(0, 20)) {
    const n = m.names[m.names.length - 1]
    console.log(`  ${m.id}  ${n.VORNAME} ${n.NACHNAME}`)
  }
  if (feedUnmatched.length > 20) console.log(`  ... +${feedUnmatched.length - 20} more`)
}

function nameKey(first: string, last: string) {
  return strip(`${first} ${last}`)
}

function strip(s: string) {
  return s.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ').filter((t) => t && !HONORIFICS.has(t) && !NAME_PARTICLES.has(t)).join(' ')
}
