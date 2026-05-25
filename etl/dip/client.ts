import { createHash } from 'node:crypto'

const FALLBACK_KEY = 'R2BZaee.DjdCyihKZMf8AOjtScubP2EVydegzjmBIQ'
const API_KEY = process.env.DIP_API_KEY ?? FALLBACK_KEY
const BASE = 'https://search.dip.bundestag.de/api/v1'
let enodiaCookie = ''

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
    const headers: Record<string, string> = { accept: 'application/json' }
    if (enodiaCookie) headers.cookie = enodiaCookie
    const res = await fetch(url, { headers })
    const text = await res.text()
    if (text.startsWith('{')) return JSON.parse(text) as ListEnvelope<T>
    if (text.includes('Enodia Verification')) await updateEnodiaCookie(text)
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

async function updateEnodiaCookie(text: string) {
  const evl = text.match(/window\.chl = "([^"]+)"/)?.[1]
  if (!evl) throw new Error('Enodia challenge missing')
  const envelope = JSON.parse(Buffer.from(evl.split('.')[0], 'base64').toString('utf8'))
  const challenge = envelope.content.challenge
  let solution = 0
  while (!createHash('sha256').update(`${challenge}${solution}`).digest('hex').startsWith('0000')) solution++
  const auth = await fetch('https://search.dip.bundestag.de/.enodia/verify', { method: 'POST', body: `${solution}-${evl}` }).then((r) => r.text())
  enodiaCookie = `enodia=${auth}`
}
