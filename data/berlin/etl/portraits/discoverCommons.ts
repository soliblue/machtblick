import { readFile, writeFile } from 'node:fs/promises'

const SPARQL_URL = 'https://query.wikidata.org/sparql'
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'
const USER_AGENT = 'machtblick-berlin/0.1 (https://machtblick.de)'
const RETRIEVED_AT = '2026-07-26'
const partyQids: Record<string, string> = {
  bsw: 'Q123121346',
  fdp: 'Q13124',
  gruene: 'Q49766',
  linke: 'Q49764',
  spd: 'Q49768'
}
const exceptions: Record<string, string> = {
  'bsw-jutta-matuschek': 'Q1714626',
  'linke-christoph-harting': 'Q11690237'
}

type Candidate = {
  slug: string
  name: string
  partySlug: string
}

type SparqlBinding = {
  item: { value: string }
  name: { value: string }
  image: { value: string }
  party?: { value: string }
}

type CommonsMetadata = Record<string, { value: string }>

type CommonsPage = {
  title: string
  imageinfo?: {
    url: string
    extmetadata: CommonsMetadata
  }[]
}

const fetchResponse = async (input: string, init: RequestInit) => {
  let response = await fetch(input, init)
  for (let attempt = 1; response.status === 429 && attempt <= 5; attempt++) {
    await new Promise((resolve) => setTimeout(
      resolve,
      (Number.parseInt(response.headers.get('retry-after') ?? '', 10) || attempt * 2) * 1_000
    ))
    response = await fetch(input, init)
  }
  return response
}

const candidates = JSON.parse(
  await readFile(new URL('../../../../research/berlin-2026/candidate-profiles.json', import.meta.url), 'utf8')
) as Candidate[]
const relevantCandidates = candidates.filter(({ partySlug, slug }) => partyQids[partySlug] || exceptions[slug])
const nameFor = (name: string) => name.replace(/^(?:(?:Prof|Dr)\.?\s*)+/i, '').trim()
const names = [...new Set(relevantCandidates.map(({ name }) => nameFor(name)))]
const bindings: SparqlBinding[] = []

for (let index = 0; index < names.length; index += 40) {
  const values = names.slice(index, index + 40)
    .flatMap((name) => [`${JSON.stringify(name)}@de`, `${JSON.stringify(name)}@en`])
    .join(' ')
  const query = `
    SELECT DISTINCT ?item ?name ?image ?party WHERE {
      VALUES ?name { ${values} }
      ?item (rdfs:label|skos:altLabel) ?name;
        wdt:P31 wd:Q5;
        wdt:P18 ?image.
      OPTIONAL { ?item wdt:P102 ?party }
    }
  `
  const response = await fetchResponse(SPARQL_URL, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/sparql-results+json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ query, format: 'json' })
  })
  if (!response.ok) throw new Error(`Wikidata SPARQL ${response.status}: ${await response.text()}`)
  bindings.push(...((await response.json()) as { results: { bindings: SparqlBinding[] } }).results.bindings)
}

const matches = relevantCandidates.flatMap((candidate) => {
  const expectedQid = exceptions[candidate.slug]
  const candidateBindings = bindings.filter(({ name }) => name.value === nameFor(candidate.name))
  const matchingBindings = expectedQid
    ? candidateBindings.filter(({ item }) => item.value.endsWith(`/${expectedQid}`))
    : candidateBindings.filter(({ party }) => party?.value.endsWith(`/${partyQids[candidate.partySlug]}`))
  const qids = [...new Set(matchingBindings.map(({ item }) => item.value.split('/').at(-1)!))]
  if (qids.length > 1) throw new Error(`Ambiguous Wikidata match for ${candidate.slug}: ${qids.join(', ')}`)
  return qids.length === 1
    ? [{
        candidateSlug: candidate.slug,
        wikidataId: qids[0],
        file: decodeURIComponent(matchingBindings[0].image.value.split('/').at(-1)!).replaceAll('_', ' ')
      }]
    : []
}).sort((left, right) => left.candidateSlug.localeCompare(right.candidateSlug))

if (matches.length !== 73) throw new Error(`Expected 73 verified Commons portraits, found ${matches.length}`)

const commonsPages: CommonsPage[] = []
for (let index = 0; index < matches.length; index += 25) {
  const titles = matches.slice(index, index + 25).map(({ file }) => `File:${file}`).join('|')
  const response = await fetchResponse(
    `${COMMONS_API}?action=query&format=json&formatversion=2&prop=imageinfo&iiprop=url|extmetadata&titles=${encodeURIComponent(titles)}&origin=*`,
    { headers: { 'User-Agent': USER_AGENT } }
  )
  if (!response.ok) throw new Error(`Wikimedia Commons ${response.status}: ${await response.text()}`)
  commonsPages.push(...((await response.json()) as { query: { pages: CommonsPage[] } }).query.pages)
}

const cleanMetadata = (value: string | undefined) => value
  ?.replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim() || null

const portraits = matches.map(({ candidateSlug, wikidataId, file }) => {
  const imageInfo = commonsPages.find(({ title }) => title === `File:${file}`)?.imageinfo?.[0]
  if (!imageInfo) throw new Error(`No Commons metadata for ${file}`)
  const author = cleanMetadata(imageInfo.extmetadata.Artist?.value)
  const license = imageInfo.extmetadata.LicenseShortName?.value
  if (!author || !license) throw new Error(`Incomplete rights metadata for ${file}`)
  return {
    candidateSlug,
    wikidataId,
    imageUrl: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=400`,
    originalImageUrl: imageInfo.url,
    sourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`,
    publisher: 'Wikimedia Commons',
    author,
    credit: cleanMetadata(imageInfo.extmetadata.Credit?.value),
    license,
    licenseUrl: imageInfo.extmetadata.LicenseUrl?.value ?? null,
    status: 'licensed',
    provenance: 'Wikidata P18, Wikimedia Commons file metadata',
    retrievedAt: RETRIEVED_AT
  }
})

await writeFile(
  new URL('../../../../research/berlin-2026/candidate-portraits.json', import.meta.url),
  `${JSON.stringify(portraits, null, 2)}\n`
)

console.log(`Wrote ${portraits.length} verified Commons portraits`)
