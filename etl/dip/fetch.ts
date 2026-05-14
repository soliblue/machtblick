import { dipList } from './client.ts'
import { nextPageNumber, writePage, readCursor, writeCursor, markDone, isDone } from './cache.ts'

const TYPES = ['Kleine Anfrage', 'Große Anfrage', 'Schriftliche Frage', 'Antrag', 'Gesetzgebung']

const slug = (t: string) =>
  t.toLowerCase().replace(/ß/g, 'ss').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function fetchEndpoint(endpoint: string, path: string, params: Record<string, string | string[]>) {
  if (isDone(endpoint)) {
    console.log(`${endpoint}: done, skipping`)
    return
  }
  let cursor = readCursor(endpoint)
  let pageNum = nextPageNumber(endpoint)
  console.log(`${endpoint}: resuming at page ${pageNum}${cursor ? ` (cursor ${cursor.slice(0, 12)}...)` : ''}`)
  while (true) {
    const next = cursor ? { ...params, cursor } : params
    const env = await dipList<unknown>(path, next)
    writePage(endpoint, pageNum, env)
    const docs = (env.documents ?? []).length
    if (pageNum % 20 === 0 || docs === 0) console.log(`  ${endpoint} page ${pageNum}: ${docs} docs, numFound=${env.numFound}`)
    pageNum++
    if (!env.cursor || env.cursor === cursor || docs === 0) {
      markDone(endpoint)
      console.log(`${endpoint}: done after ${pageNum - 1} pages`)
      return
    }
    cursor = env.cursor
    writeCursor(endpoint, cursor)
  }
}

const updatedStart = process.env.DIP_UPDATED_START

for (const t of TYPES) {
  const s = slug(t)
  const params: Record<string, string | string[]> = { 'f.wahlperiode': '21', 'f.vorgangstyp': t, format: 'json' }
  if (updatedStart) params['f.aktualisiert.start'] = updatedStart
  await fetchEndpoint(`vorgang/${s}`, '/vorgang', params)
  await fetchEndpoint(`vorgangsposition/${s}`, '/vorgangsposition', params)
}

const aktParams: Record<string, string | string[]> = { 'f.wahlperiode': '21', format: 'json' }
if (updatedStart) aktParams['f.aktualisiert.start'] = updatedStart
await fetchEndpoint('aktivitaet', '/aktivitaet', aktParams)
