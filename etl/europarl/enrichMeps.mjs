import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const cacheDir = fileURLToPath(new URL('./raw/ep-cache', import.meta.url))
const mepDir = `${cacheDir}/meps`
const orgDir = `${cacheDir}/orgs`
for (const d of [cacheDir, mepDir, orgDir]) mkdirSync(d, { recursive: true })

const UA = 'machtblick-europarl/0.1 (https://machtblick.de; asoliman96@gmail.com)'
const orgCache = new Map()

async function apiGet(url, cachePath) {
  if (existsSync(cachePath)) return JSON.parse(readFileSync(cachePath, 'utf8'))
  let attempt = 0
  while (true) {
    const res = await fetch(url, { headers: { Accept: 'application/ld+json', 'User-Agent': UA } })
    const body = await res.text()
    const looksJson = body.trimStart().startsWith('{')
    if (res.ok && looksJson) {
      writeFileSync(cachePath, body)
      return JSON.parse(body)
    }
    attempt++
    if (attempt > 8) return null
    await new Promise((r) => setTimeout(r, Math.min(1500 * 2 ** attempt, 60000)))
  }
}

async function resolveOrg(orgRef) {
  const id = orgRef.split('/').pop()
  if (orgCache.has(id)) return orgCache.get(id)
  const data = await apiGet(`https://data.europarl.europa.eu/api/v2/corporate-bodies/${id}`, `${orgDir}/${id}.json`)
  const body = data?.data?.[0]
  const label = body?.altLabel?.de ?? body?.altLabel?.en ?? body?.prefLabel?.de ?? body?.prefLabel?.en ?? null
  orgCache.set(id, label)
  return label
}

async function fetchMep(id) {
  const data = await apiGet(`https://data.europarl.europa.eu/api/v2/meps/${id}`, `${mepDir}/${id}.json`)
  const body = data?.data?.[0]
  if (!body) return { nationalPartyRef: null, photo: `https://www.europarl.europa.eu/mepphoto/${id}.jpg` }
  let nationalPartyRef = null
  let latestStart = ''
  for (const m of body.hasMembership ?? []) {
    const cls = m.membershipClassification ?? ''
    const dur = m.memberDuring ?? {}
    if (!cls.includes('NATIONAL_POLITICAL_GROUP')) continue
    if (dur.endDate) continue
    if ((dur.startDate ?? '') >= latestStart) {
      latestStart = dur.startDate ?? ''
      nationalPartyRef = m.organization
    }
  }
  return { nationalPartyRef, photo: body.img ?? `https://www.europarl.europa.eu/mepphoto/${id}.jpg` }
}

export async function enrichMeps(ids, concurrency = 4) {
  const list = [...ids]
  const out = new Map()
  let cursor = 0
  let done = 0
  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < list.length) {
      const id = list[cursor++]
      const { nationalPartyRef, photo } = await fetchMep(id)
      const nationalParty = nationalPartyRef ? await resolveOrg(nationalPartyRef) : null
      out.set(id, { nationalParty, photo })
      done++
      if (done % 50 === 0) console.log(`  meps enriched ${done}/${list.length}`)
    }
  })
  await Promise.all(workers)
  return out
}
