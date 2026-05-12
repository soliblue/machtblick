const FALLBACK_KEY = 'R2BZaee.DjdCyihKZMf8AOjtScubP2EVydegzjmBIQ'
const API_KEY = process.env.DIP_API_KEY ?? FALLBACK_KEY
const BASE = 'https://search.dip.bundestag.de/api/v1'

export type ListEnvelope<T> = { numFound: number; documents: T[]; cursor: string }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function dipList<T>(path: string, params: Record<string, string | string[]>) {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('apikey', API_KEY)
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) for (const item of v) url.searchParams.append(k, item)
    else url.searchParams.set(k, v)
  }
  let attempt = 0
  while (true) {
    const res = await fetch(url, { headers: { accept: 'application/json' } })
    const text = await res.text()
    if (text.startsWith('{')) return JSON.parse(text) as ListEnvelope<T>
    attempt++
    if (attempt > 30) throw new Error(`DIP non-JSON after ${attempt} retries: ${path}`)
    await sleep(Math.min(300000, 10000 * attempt))
  }
}

export async function* paginate<T>(path: string, params: Record<string, string | string[]>) {
  let cursor = ''
  while (true) {
    const next = cursor ? { ...params, cursor } : params
    const env = await dipList<T>(path, next)
    for (const doc of env.documents ?? []) yield doc
    if (!env.cursor || env.cursor === cursor) break
    cursor = env.cursor
  }
}
