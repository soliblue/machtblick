import { sql } from 'drizzle-orm'
import { db } from '@machtblick/db/client'
import { members, memberAbgeordnetenwatch, memberMandates } from '@machtblick/db/schema'
import { AW_API, awJson, awText } from '../_shared/awClient.ts'
import { buildMemberMatcher, type AwProfile } from './memberMatcher.ts'
import { publishAfterAwReplacementsReady } from './publishReady.ts'

const WP21 = 161

type Mandate = {
  id: number
  type: string
  politician: { id: number; label: string; abgeordnetenwatch_url: string }
}
type AwListResponse = { meta: { result: { total: number; count: number; range_start: number; range_end: number } }; data: Mandate[] }
type Politician = AwProfile & {
  id: number
  label: string
  first_name: string
  last_name: string
  ext_id_bundestagsverwaltung: string | null
  abgeordnetenwatch_url: string
} & Record<string, unknown>
type AwSingleResponse = { data: Politician }
type PreparedProfile = {
  memberId: string
  awPoliticianId: number
  rawJson: string
  pictureUrl: string | null
  fetchedAt: string
}

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
const ourMembers = db.select({ id: members.id, first: members.firstName, last: members.lastName, btMdbId: members.btMdbId, picture: members.pictureUrl }).from(members).all()
const memberByAwPoliticianId = new Map<number, string>()
for (const row of db.select({ memberId: memberMandates.memberId, awPoliticianId: memberMandates.awPoliticianId })
  .from(memberMandates)
  .where(sql`${memberMandates.termId} = 21 AND ${memberMandates.awPoliticianId} IS NOT NULL`)
  .all()) {
  const existing = memberByAwPoliticianId.get(row.awPoliticianId!)
  if (existing && existing !== row.memberId) throw new Error(`duplicate term-21 AW politician id ${row.awPoliticianId}: ${existing}, ${row.memberId}`)
  memberByAwPoliticianId.set(row.awPoliticianId!, row.memberId)
}
const matchMember = buildMemberMatcher(ourMembers, memberByAwPoliticianId, new Set((db.all(sql`
  SELECT DISTINCT vm.member_id AS id FROM vote_members vm JOIN votes v ON v.id = vm.vote_id WHERE v.term_id = 21
  UNION
  SELECT DISTINCT member_id AS id FROM member_affiliations WHERE term_id = 21 AND valid_to IS NULL
`) as Array<{ id: string }>).map((row) => row.id)))
const storedMappings = db.select({
  memberId: memberAbgeordnetenwatch.memberId,
  awPoliticianId: memberAbgeordnetenwatch.awPoliticianId,
  rawJson: memberAbgeordnetenwatch.rawJson,
  pictureUrl: memberAbgeordnetenwatch.pictureUrl,
}).from(memberAbgeordnetenwatch).all()
const validMappings = storedMappings.filter((row) => matchMember(JSON.parse(row.rawJson) as Politician, row.awPoliticianId).member?.id === row.memberId)
const invalidMappings = storedMappings.filter((row) => !validMappings.includes(row))
const existingRows = db.select({
  memberId: memberAbgeordnetenwatch.memberId,
  awPoliticianId: memberAbgeordnetenwatch.awPoliticianId,
  rawJson: memberAbgeordnetenwatch.rawJson,
  pictureUrl: memberAbgeordnetenwatch.pictureUrl,
}).from(memberAbgeordnetenwatch).where(sql`EXISTS (SELECT 1 FROM member_affiliations a WHERE a.member_id = ${memberAbgeordnetenwatch.memberId} AND a.term_id = 21) AND EXISTS (SELECT 1 FROM members m WHERE m.id = ${memberAbgeordnetenwatch.memberId} AND (m.picture_url IS NULL OR m.picture_url LIKE '%abgeordnetenwatch.de%'))`).all().filter((row) => validMappings.some((mapping) => mapping.memberId === row.memberId && mapping.awPoliticianId === row.awPoliticianId))
const alreadyIngested = new Set(validMappings.map((row) => row.awPoliticianId))
const todo = uniqueMandates.filter((m) => !alreadyIngested.has(m.politician.id))
console.log(`unique politicians: ${uniqueMandates.length} (${alreadyIngested.size} already ingested, ${todo.length} todo)`)

let refreshedProfiles = 0
let discoveredPictures = 0
let removedPictures = 0
let changedPictures = 0
const refreshedRows: Array<{ memberId: string; pictureUrl: string | null; fetchedAt: string }> = []
for (const row of existingRows) {
  const pol = JSON.parse(row.rawJson) as Politician
  const pictureUrl = scrapePicture(await awText(pol.abgeordnetenwatch_url))
  refreshedRows.push({ memberId: row.memberId, pictureUrl, fetchedAt: new Date().toISOString() })
  refreshedProfiles++
  if (!row.pictureUrl && pictureUrl) discoveredPictures++
  if (row.pictureUrl && !pictureUrl) removedPictures++
  if (row.pictureUrl !== pictureUrl) changedPictures++
}
console.log(`fallback profiles refreshed: ${refreshedProfiles} (${discoveredPictures} found, ${removedPictures} removed, ${changedPictures} changed)`)

let viaAw = 0
let viaId = 0
let viaName = 0
let ambiguous = 0
let unmatched = 0
let withPicture = 0
let processed = 0

const synchronized = await publishAfterAwReplacementsReady<Mandate, PreparedProfile, number>(
  todo,
  async (mandate) => {
    const pid = mandate.politician.id
    const pol = (await awJson<AwSingleResponse>(`${AW_API}/politicians/${pid}`)).data
    const pictureUrl = scrapePicture(await awText(`https://www.abgeordnetenwatch.de/profile/${mandate.politician.abgeordnetenwatch_url.split('/').pop() ?? ''}`))
    const member = matchMember(pol, pid)
    processed++
    if (processed % 25 === 0) console.log(`  ${processed} / ${todo.length}`)
    if (!member.member) {
      if (member.reason === 'ambiguous') ambiguous++
      else unmatched++
      console.log(`  no match: ${pol.label} (aw=${pid}, mdb=${pol.ext_id_bundestagsverwaltung}): ${member.reason}`)
      return null
    }
    if (member.via === 'aw') viaAw++
    else if (member.via === 'mdb') viaId++
    else viaName++
    if (pictureUrl) withPicture++
    return { memberId: member.member.id, awPoliticianId: pid, rawJson: JSON.stringify(pol), pictureUrl, fetchedAt: new Date().toISOString() }
  },
  validMappings,
  invalidMappings,
  new Set(uniqueMandates.map((mandate) => mandate.politician.id)),
  (replacements) => db.transaction((tx) => {
    for (const row of invalidMappings) {
      if (row.pictureUrl) tx.update(members).set({ pictureUrl: null }).where(sql`${members.id} = ${row.memberId} AND ${members.pictureUrl} = ${row.pictureUrl}`).run()
      tx.delete(memberAbgeordnetenwatch).where(sql`${memberAbgeordnetenwatch.memberId} = ${row.memberId}`).run()
    }
    for (const row of refreshedRows) tx.update(memberAbgeordnetenwatch).set({ pictureUrl: row.pictureUrl, fetchedAt: row.fetchedAt }).where(sql`${memberAbgeordnetenwatch.memberId} = ${row.memberId}`).run()
    for (const row of replacements) {
      tx.insert(memberAbgeordnetenwatch).values(row).onConflictDoUpdate({
        target: memberAbgeordnetenwatch.memberId,
        set: { awPoliticianId: row.awPoliticianId, rawJson: row.rawJson, pictureUrl: row.pictureUrl, fetchedAt: row.fetchedAt },
      }).run()
    }
    return Number(tx.run(sql`UPDATE members SET picture_url = (SELECT picture_url FROM member_abgeordnetenwatch WHERE member_abgeordnetenwatch.member_id = members.id) WHERE EXISTS (SELECT 1 FROM member_abgeordnetenwatch aw WHERE aw.member_id = members.id) AND (picture_url LIKE '%abgeordnetenwatch.de%' OR (picture_url IS NULL AND EXISTS (SELECT 1 FROM member_abgeordnetenwatch aw WHERE aw.member_id = members.id AND aw.picture_url IS NOT NULL)))`).changes)
  }),
)
console.log(`invalid mappings removed: ${invalidMappings.length}`)

console.log(`matched via AW id:  ${viaAw}`)
console.log(`matched via mdb id: ${viaId}`)
console.log(`matched via name:   ${viaName}`)
console.log(`name ambiguous:     ${ambiguous}`)
console.log(`unmatched:          ${unmatched}`)
console.log(`with picture scrape: ${withPicture}`)

const totalAfter = db.select({ c: sql<number>`COUNT(*)` }).from(members).where(sql`picture_url IS NOT NULL`).all()[0].c
console.log(`\nabgeordnetenwatch ingest:`)
console.log(`  members total:        ${ourMembers.length}`)
console.log(`  aw rows written:      ${viaAw + viaId + viaName}`)
console.log(`  picture synchronized: ${synchronized}`)
console.log(`  members with picture: ${totalAfter} (${((totalAfter / ourMembers.length) * 100).toFixed(1)}%)`)

function scrapePicture(html: string): string | null {
  const match = html.match(/sites\/default\/files\/styles\/[a-z_]+\/public\/politicians-profile-pictures\/[^"?]+/)
  if (!match) return null
  const path = match[0].replace(/styles\/[a-z_]+\/public\//, '')
  return `https://www.abgeordnetenwatch.de/${path}`
}
