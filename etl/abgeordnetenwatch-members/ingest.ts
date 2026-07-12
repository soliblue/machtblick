import { sql } from 'drizzle-orm'
import { db } from '@machtblick/db/client'
import { members, memberAbgeordnetenwatch } from '@machtblick/db/schema'

const UA = 'machtblick-bundestag/0.1 (https://github.com/soliblue/machtblick; hello@machtblick.de)'
const AW = 'https://www.abgeordnetenwatch.de/api/v2'
const WP21 = 161
const CONCURRENCY = 2
const DELAY_MS = 600
const MAX_RETRIES = 8

const HONORIFICS = new Set(['dr', 'prof', 'med', 'hc', 'h', 'c', 'dent', 'rer', 'nat', 'phil', 'jur', 'ing', 'mult', 'habil', 'mag', 'lic', 'theol', 'dipl', 'pol'])
const NAME_PARTICLES = new Set(['von', 'van', 'de', 'der', 'den', 'dos', 'da', 'di', 'du', 'le', 'la', 'zu', 'auf', 'freiherr', 'graf', 'edler', 'edle', 'baron', 'baronin'])

type Mandate = {
  id: number
  type: string
  politician: { id: number; label: string; abgeordnetenwatch_url: string }
}
type AwListResponse = { meta: { result: { total: number; count: number; range_start: number; range_end: number } }; data: Mandate[] }
type Politician = {
  id: number
  label: string
  first_name: string
  last_name: string
  ext_id_bundestagsverwaltung: string | null
  abgeordnetenwatch_url: string
} & Record<string, unknown>
type AwSingleResponse = { data: Politician }

const mandates: Mandate[] = []
let rangeStart = 0
const pageSize = 200
while (true) {
  const url = `${AW}/candidacies-mandates?parliament_period=${WP21}&type=mandate&range_start=${rangeStart}&range_end=${rangeStart + pageSize}`
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`AW list ${res.status}: ${await res.text()}`)
  const json = (await res.json()) as AwListResponse
  mandates.push(...json.data)
  if (json.data.length < pageSize) break
  rangeStart += pageSize
}
console.log(`mandates fetched: ${mandates.length}`)
const uniqueMandates = Array.from(new Map(mandates.map((m) => [m.politician.id, m])).values())
const alreadyIngested = new Set(db.select({ id: memberAbgeordnetenwatch.awPoliticianId }).from(memberAbgeordnetenwatch).all().map((r) => r.id))
const todo = uniqueMandates.filter((m) => !alreadyIngested.has(m.politician.id))
console.log(`unique politicians: ${uniqueMandates.length} (${alreadyIngested.size} already ingested, ${todo.length} todo)`)

const ourMembers = db.select({ id: members.id, first: members.firstName, last: members.lastName, btMdbId: members.btMdbId, picture: members.pictureUrl }).from(members).all()
const byMdbId = new Map(ourMembers.filter((m) => m.btMdbId).map((m) => [m.btMdbId!, m]))
const byNameKey = new Map<string, typeof ourMembers[number][]>()
for (const m of ourMembers) {
  const key = nameKey(firstToken(m.first), m.last)
  const arr = byNameKey.get(key) ?? []
  arr.push(m)
  byNameKey.set(key, arr)
}

const seen = new Set<string>(db.select({ id: memberAbgeordnetenwatch.memberId }).from(memberAbgeordnetenwatch).all().map((r) => r.id))
let viaId = 0
let viaName = 0
let ambiguous = 0
let unmatched = 0
let withPicture = 0
let processed = 0

await pool(todo, CONCURRENCY, async (m) => {
  const pid = m.politician.id
  const slug = m.politician.abgeordnetenwatch_url.split('/').pop() ?? ''
  const pJson = await fetchJson<AwSingleResponse>(`${AW}/politicians/${pid}`)
  const pol = pJson.data
  await sleep(DELAY_MS)
  const html = await fetchText(`https://www.abgeordnetenwatch.de/profile/${slug}`)
  const pictureUrl = scrapePicture(html)
  await sleep(DELAY_MS)
  const member = matchMember(pol)
  processed++
  if (processed % 25 === 0) console.log(`  ${processed} / ${todo.length}`)
  if (!member.member) {
    if (member.reason === 'ambiguous') ambiguous++
    else unmatched++
    console.log(`  no match: ${pol.label} (aw=${pid}, mdb=${pol.ext_id_bundestagsverwaltung}): ${member.reason}`)
    return
  }
  if (seen.has(member.member.id)) return
  seen.add(member.member.id)
  if (member.via === 'mdb') viaId++
  else viaName++
  if (pictureUrl) withPicture++
  db.insert(memberAbgeordnetenwatch).values({
    memberId: member.member.id,
    awPoliticianId: pid,
    rawJson: JSON.stringify(pol),
    pictureUrl,
    fetchedAt: new Date().toISOString(),
  }).onConflictDoUpdate({
    target: memberAbgeordnetenwatch.memberId,
    set: { awPoliticianId: pid, rawJson: JSON.stringify(pol), pictureUrl, fetchedAt: new Date().toISOString() },
  }).run()
})

console.log(`matched via mdb id: ${viaId}`)
console.log(`matched via name:   ${viaName}`)
console.log(`name ambiguous:     ${ambiguous}`)
console.log(`unmatched:          ${unmatched}`)
console.log(`with picture scrape: ${withPicture}`)

const result = db.run(sql`UPDATE members SET picture_url = (SELECT picture_url FROM member_abgeordnetenwatch WHERE member_abgeordnetenwatch.member_id = members.id) WHERE picture_url IS NULL AND EXISTS (SELECT 1 FROM member_abgeordnetenwatch aw WHERE aw.member_id = members.id AND aw.picture_url IS NOT NULL)`)
const backfilled = Number(result.changes)

const totalAfter = db.select({ c: sql<number>`COUNT(*)` }).from(members).where(sql`picture_url IS NOT NULL`).all()[0].c
console.log(`\nabgeordnetenwatch ingest:`)
console.log(`  members total:        ${ourMembers.length}`)
console.log(`  aw rows written:      ${viaId + viaName}`)
console.log(`  picture backfilled:   ${backfilled}`)
console.log(`  members with picture: ${totalAfter} (${((totalAfter / ourMembers.length) * 100).toFixed(1)}%)`)

function matchMember(pol: Politician): { member: typeof ourMembers[number] | null; via: 'mdb' | 'name' | 'none'; reason?: string } {
  const mdb = pol.ext_id_bundestagsverwaltung ? pol.ext_id_bundestagsverwaltung.padStart(8, '0') : null
  const byId = mdb ? byMdbId.get(mdb) : undefined
  if (byId) return { member: byId, via: 'mdb' }
  const hits = byNameKey.get(nameKey(firstToken(pol.first_name), pol.last_name)) ?? []
  if (hits.length === 1) return { member: hits[0], via: 'name' }
  if (hits.length > 1) return { member: null, via: 'none', reason: 'ambiguous' }
  return { member: null, via: 'none', reason: 'no name hit' }
}

function scrapePicture(html: string): string | null {
  const match = html.match(/sites\/default\/files\/styles\/[a-z_]+\/public\/politicians-profile-pictures\/[^"?]+/)
  if (!match) return null
  const path = match[0].replace(/styles\/[a-z_]+\/public\//, '')
  return `https://www.abgeordnetenwatch.de/${path}`
}

async function fetchWithRetry(url: string, headers: Record<string, string>): Promise<Response | null> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url, { headers }).catch((e: Error) => ({ ok: false, status: 0, text: async () => e.message } as unknown as Response))
    if (res.ok) return res
    if (res.status === 404) return null
    const wait = Math.min(60000, 1500 * Math.pow(2, attempt))
    console.log(`  ${res.status} on ${url}, backing off ${wait}ms`)
    await sleep(wait)
  }
  throw new Error(`fetch ${url} exhausted retries`)
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetchWithRetry(url, { 'User-Agent': UA, Accept: 'application/json' })
  if (!res) throw new Error(`fetch ${url} 404`)
  return (await res.json()) as T
}

async function fetchText(url: string): Promise<string> {
  const res = await fetchWithRetry(url, { 'User-Agent': UA })
  if (!res) return ''
  return await res.text()
}

async function pool<T>(items: T[], n: number, fn: (item: T) => Promise<void>) {
  let i = 0
  const workers = Array.from({ length: n }, async () => {
    while (i < items.length) {
      const idx = i++
      await fn(items[idx])
    }
  })
  await Promise.all(workers)
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function firstToken(s: string) {
  return s.split(/\s+/)[0] ?? ''
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
