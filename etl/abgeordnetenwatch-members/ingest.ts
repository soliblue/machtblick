import { sql } from 'drizzle-orm'
import { db } from '@machtblick/db/client'
import { members, memberAbgeordnetenwatch } from '@machtblick/db/schema'
import { HONORIFICS, NAME_PARTICLES } from '../_shared/names.ts'
import { AW_API, awJson, awText } from '../_shared/awClient.ts'

const WP21 = 161

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
  const url = `${AW_API}/candidacies-mandates?parliament_period=${WP21}&type=mandate&range_start=${rangeStart}&range_end=${rangeStart + pageSize}`
  const json = await awJson<AwListResponse>(url)
  mandates.push(...json.data)
  if (json.data.length < pageSize) break
  rangeStart += pageSize
}
console.log(`mandates fetched: ${mandates.length}`)
const uniqueMandates = Array.from(new Map(mandates.map((m) => [m.politician.id, m])).values())
const existingRows = db.select({
  memberId: memberAbgeordnetenwatch.memberId,
  awPoliticianId: memberAbgeordnetenwatch.awPoliticianId,
  rawJson: memberAbgeordnetenwatch.rawJson,
  pictureUrl: memberAbgeordnetenwatch.pictureUrl,
}).from(memberAbgeordnetenwatch).where(sql`EXISTS (SELECT 1 FROM member_affiliations a WHERE a.member_id = ${memberAbgeordnetenwatch.memberId} AND a.term_id = 21) AND EXISTS (SELECT 1 FROM members m WHERE m.id = ${memberAbgeordnetenwatch.memberId} AND (m.picture_url IS NULL OR m.picture_url LIKE '%abgeordnetenwatch.de%'))`).all()
const alreadyIngested = new Set(db.select({ id: memberAbgeordnetenwatch.awPoliticianId }).from(memberAbgeordnetenwatch).all().map((row) => row.id))
const todo = uniqueMandates.filter((m) => !alreadyIngested.has(m.politician.id))
console.log(`unique politicians: ${uniqueMandates.length} (${alreadyIngested.size} already ingested, ${todo.length} todo)`)

let refreshedProfiles = 0
let discoveredPictures = 0
let removedPictures = 0
let changedPictures = 0
for (const row of existingRows) {
  const pol = JSON.parse(row.rawJson) as Politician
  const pictureUrl = scrapePicture(await awText(pol.abgeordnetenwatch_url))
  db.update(memberAbgeordnetenwatch).set({ pictureUrl, fetchedAt: new Date().toISOString() }).where(sql`${memberAbgeordnetenwatch.memberId} = ${row.memberId}`).run()
  refreshedProfiles++
  if (!row.pictureUrl && pictureUrl) discoveredPictures++
  if (row.pictureUrl && !pictureUrl) removedPictures++
  if (row.pictureUrl !== pictureUrl) changedPictures++
}
console.log(`fallback profiles refreshed: ${refreshedProfiles} (${discoveredPictures} found, ${removedPictures} removed, ${changedPictures} changed)`)

const ourMembers = db.select({ id: members.id, first: members.firstName, last: members.lastName, btMdbId: members.btMdbId, picture: members.pictureUrl }).from(members).all()
const byMdbId = new Map(ourMembers.filter((m) => m.btMdbId).map((m) => [m.btMdbId!, m]))
const byNameKey = new Map<string, typeof ourMembers[number][]>()
for (const m of ourMembers) {
  const key = nameKey(firstToken(m.first), m.last)
  const arr = byNameKey.get(key) ?? []
  arr.push(m)
  byNameKey.set(key, arr)
}

const seen = new Set<string>()
let viaId = 0
let viaName = 0
let ambiguous = 0
let unmatched = 0
let withPicture = 0
let processed = 0

for (const m of todo) {
  const pid = m.politician.id
  const slug = m.politician.abgeordnetenwatch_url.split('/').pop() ?? ''
  const pJson = await awJson<AwSingleResponse>(`${AW_API}/politicians/${pid}`)
  const pol = pJson.data
  const html = await awText(`https://www.abgeordnetenwatch.de/profile/${slug}`)
  const pictureUrl = scrapePicture(html)
  const member = matchMember(pol)
  processed++
  if (processed % 25 === 0) console.log(`  ${processed} / ${todo.length}`)
  if (!member.member) {
    if (member.reason === 'ambiguous') ambiguous++
    else unmatched++
    console.log(`  no match: ${pol.label} (aw=${pid}, mdb=${pol.ext_id_bundestagsverwaltung}): ${member.reason}`)
  } else if (!seen.has(member.member.id)) {
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
  }
}

console.log(`matched via mdb id: ${viaId}`)
console.log(`matched via name:   ${viaName}`)
console.log(`name ambiguous:     ${ambiguous}`)
console.log(`unmatched:          ${unmatched}`)
console.log(`with picture scrape: ${withPicture}`)

const result = db.run(sql`UPDATE members SET picture_url = (SELECT picture_url FROM member_abgeordnetenwatch WHERE member_abgeordnetenwatch.member_id = members.id) WHERE EXISTS (SELECT 1 FROM member_abgeordnetenwatch aw WHERE aw.member_id = members.id) AND (picture_url LIKE '%abgeordnetenwatch.de%' OR (picture_url IS NULL AND EXISTS (SELECT 1 FROM member_abgeordnetenwatch aw WHERE aw.member_id = members.id AND aw.picture_url IS NOT NULL)))`)
const synchronized = Number(result.changes)

const totalAfter = db.select({ c: sql<number>`COUNT(*)` }).from(members).where(sql`picture_url IS NOT NULL`).all()[0].c
console.log(`\nabgeordnetenwatch ingest:`)
console.log(`  members total:        ${ourMembers.length}`)
console.log(`  aw rows written:      ${viaId + viaName}`)
console.log(`  picture synchronized: ${synchronized}`)
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
