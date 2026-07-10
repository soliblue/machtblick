import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const cacheDir = fileURLToPath(new URL('./raw/cache', import.meta.url))
await mkdir(cacheDir, { recursive: true })

const BASE = 'https://www.abgeordnetenwatch.de/api/v2'
const UA = 'machtblick-landtage/0.1 (https://github.com/soli/machtblick; asoliman96@gmail.com)'
const DELAY = 1600

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const cachePath = (url) => `${cacheDir}/${createHash('sha1').update(url).digest('hex').slice(0, 20)}.json`

let last = 0
async function throttledFetch(url) {
  const wait = DELAY - (Date.now() - last)
  if (wait > 0) await sleep(wait)
  let attempt = 0
  while (true) {
    last = Date.now()
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
    if (res.ok) return res.json()
    attempt++
    if (attempt > 6) throw new Error(`fetch failed ${res.status} for ${url}`)
    const backoff = res.status === 429 ? 5000 * attempt : 2000 * attempt
    console.log(`  ${res.status} on ${url.replace(BASE, '')} — retry ${attempt} in ${backoff}ms`)
    await sleep(backoff)
  }
}

export async function api(path, { cache = true } = {}) {
  const url = path.startsWith('http') ? path : `${BASE}/${path}`
  const cp = cachePath(url)
  if (cache) {
    const hit = await readFile(cp, 'utf8').catch(() => null)
    if (hit) return JSON.parse(hit)
  }
  const json = await throttledFetch(url)
  if (cache) await writeFile(cp, JSON.stringify(json))
  return json
}

export async function apiTotal(path) {
  const sep = path.includes('?') ? '&' : '?'
  const json = await api(`${path}${sep}range_end=0`, { cache: false })
  return json.meta.result.total
}

export async function apiList(path) {
  const sep = path.includes('?') ? '&' : '?'
  const out = []
  let start = 0
  const page = 100
  while (true) {
    const json = await api(`${path}${sep}range_start=${start}&range_end=${page}`, { cache: false })
    const rows = json.data ?? []
    out.push(...rows)
    if (rows.length < page) break
    start += page
  }
  return out
}
