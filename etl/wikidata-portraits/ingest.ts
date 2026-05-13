import { sql } from 'drizzle-orm'
import { db } from '@machtblick/db/client'
import { members } from '@machtblick/db/schema'

const UA = 'machtblick-bundestag/0.1 (https://github.com/soli/machtblick; asoliman96@gmail.com)'
const SPARQL = 'https://query.wikidata.org/sparql'
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'

const HONORIFICS = new Set(['dr', 'prof', 'med', 'hc', 'h', 'c', 'dent', 'rer', 'nat', 'phil', 'jur', 'ing', 'mult', 'habil', 'mag', 'lic', 'theol', 'dipl', 'pol'])
const NAME_PARTICLES = new Set(['von', 'van', 'de', 'der', 'den', 'dos', 'da', 'di', 'du', 'le', 'la', 'zu', 'auf', 'freiherr', 'graf', 'edler', 'edle', 'baron', 'baronin'])

const query = `
SELECT ?item ?itemLabel ?image ?btMdbId ?firstName ?lastName WHERE {
  ?item p:P39 ?stmt .
  ?stmt ps:P39 ?pos .
  ?pos wdt:P279* wd:Q1939555 .
  OPTIONAL { ?item wdt:P18 ?image }
  OPTIONAL { ?item wdt:P11597 ?btMdbId }
  OPTIONAL { ?item wdt:P735 ?fn . ?fn rdfs:label ?firstName FILTER(LANG(?firstName) = "de") }
  OPTIONAL { ?item wdt:P734 ?ln . ?ln rdfs:label ?lastName FILTER(LANG(?lastName) = "de") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en" }
}
`

type SparqlBinding = {
  item: { value: string }
  itemLabel?: { value: string }
  image?: { value: string }
  btMdbId?: { value: string }
  firstName?: { value: string }
  lastName?: { value: string }
}

const sparqlRes = await fetch(`${SPARQL}?format=json&query=${encodeURIComponent(query)}`, {
  headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' },
})
if (!sparqlRes.ok) throw new Error(`SPARQL ${sparqlRes.status}: ${await sparqlRes.text()}`)
const sparqlJson = (await sparqlRes.json()) as { results: { bindings: SparqlBinding[] } }
const bindings = sparqlJson.results.bindings.filter((b) => b.image)
console.log(`wikidata: ${sparqlJson.results.bindings.length} MdB items, ${bindings.length} with P18 image`)

type Candidate = { itemQid: string; label: string; image: string; btMdbId: string | null; firstName: string | null; lastName: string | null }
const candidates: Candidate[] = bindings.map((b) => ({
  itemQid: b.item.value.replace('http://www.wikidata.org/entity/', ''),
  label: b.itemLabel?.value ?? '',
  image: decodeFilename(b.image!.value),
  btMdbId: b.btMdbId?.value ?? null,
  firstName: b.firstName?.value ?? null,
  lastName: b.lastName?.value ?? null,
}))

const ourMembers = db.select({ id: members.id, first: members.firstName, last: members.lastName, btMdbId: members.btMdbId }).from(members).all()
const byMdbId = new Map(ourMembers.filter((m) => m.btMdbId).map((m) => [m.btMdbId!, m]))
const byNameKey = new Map<string, typeof ourMembers[number][]>()
for (const m of ourMembers) {
  const key = nameKey(firstToken(m.first), m.last)
  const arr = byNameKey.get(key) ?? []
  arr.push(m)
  byNameKey.set(key, arr)
}

type Match = { memberId: string; image: string; itemQid: string }
const matched: Match[] = []
const seenMemberIds = new Set<string>()
let viaId = 0
let viaName = 0
let nameAmbiguous = 0
let unmatched = 0

for (const c of candidates) {
  const padded = c.btMdbId ? c.btMdbId.padStart(8, '0') : null
  const byId = padded ? byMdbId.get(padded) : undefined
  if (byId) {
    if (seenMemberIds.has(byId.id)) continue
    seenMemberIds.add(byId.id)
    matched.push({ memberId: byId.id, image: c.image, itemQid: c.itemQid })
    viaId++
    continue
  }
  const labelParts = c.label.split(/\s+/).filter(Boolean)
  const fn = c.firstName ?? labelParts[0] ?? ''
  const ln = c.lastName ?? labelParts[labelParts.length - 1] ?? ''
  if (!fn || !ln) {
    unmatched++
    continue
  }
  const hits = byNameKey.get(nameKey(firstToken(fn), ln)) ?? []
  const remaining = hits.filter((h) => !seenMemberIds.has(h.id))
  if (remaining.length === 1) {
    seenMemberIds.add(remaining[0].id)
    matched.push({ memberId: remaining[0].id, image: c.image, itemQid: c.itemQid })
    viaName++
  } else if (remaining.length > 1) {
    nameAmbiguous++
  } else {
    unmatched++
  }
}

console.log(`matched via P11597: ${viaId}`)
console.log(`matched via name:   ${viaName}`)
console.log(`name ambiguous:     ${nameAmbiguous}`)
console.log(`unmatched:          ${unmatched}`)
console.log(`fetching Commons metadata for ${matched.length} files...`)

const enriched: { memberId: string; pictureUrl: string; pictureAuthor: string | null; pictureLicense: string | null; pictureSourceUrl: string }[] = []
const BATCH = 25
for (let i = 0; i < matched.length; i += BATCH) {
  const batch = matched.slice(i, i + BATCH)
  const titles = batch.map((m) => `File:${m.image}`).join('|')
  const url = `${COMMONS_API}?action=query&format=json&prop=imageinfo&iiprop=extmetadata&titles=${encodeURIComponent(titles)}&origin=*`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`Commons API ${res.status}: ${await res.text()}`)
  const json = (await res.json()) as CommonsResponse
  const pages = json.query?.pages ?? {}
  const byTitle = new Map<string, CommonsPage>()
  for (const p of Object.values(pages)) byTitle.set(p.title, p)
  for (const m of batch) {
    const page = byTitle.get(`File:${m.image}`)
    const meta = page?.imageinfo?.[0]?.extmetadata
    const author = stripHtml(meta?.Artist?.value)
    const license = meta?.LicenseShortName?.value ?? null
    enriched.push({
      memberId: m.memberId,
      pictureUrl: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(m.image)}?width=400`,
      pictureAuthor: author,
      pictureLicense: license,
      pictureSourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(m.image)}`,
    })
  }
  console.log(`  ${Math.min(i + BATCH, matched.length)} / ${matched.length}`)
}

type CommonsResponse = { query?: { pages?: Record<string, CommonsPage> } }
type CommonsPage = { title: string; imageinfo?: { extmetadata?: Record<string, { value: string }> }[] }

db.transaction((tx) => {
  for (const e of enriched) {
    tx.update(members).set({
      pictureUrl: e.pictureUrl,
      pictureAuthor: e.pictureAuthor,
      pictureLicense: e.pictureLicense,
      pictureSourceUrl: e.pictureSourceUrl,
    }).where(sql`${members.id} = ${e.memberId}`).run()
  }
})

const totalMembers = ourMembers.length
const coverage = enriched.length
console.log(`\nportraits ingest:`)
console.log(`  members total:    ${totalMembers}`)
console.log(`  portraits set:    ${coverage} (${((coverage / totalMembers) * 100).toFixed(1)}%)`)

function decodeFilename(commonsUrl: string) {
  const last = commonsUrl.split('/').pop() ?? ''
  return decodeURIComponent(last).replace(/_/g, ' ')
}

function stripHtml(html: string | undefined) {
  if (!html) return null
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim()
  return text || null
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
