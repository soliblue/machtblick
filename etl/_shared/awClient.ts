export const AW_API = 'https://www.abgeordnetenwatch.de/api/v2'
export const AW_UA = 'machtblick-bundestag/0.1 (https://github.com/soliblue/machtblick; hello@machtblick.de)'

const MIN_REQUEST_INTERVAL_MS = 2100
let nextRequestAt = 0
let requestQueue = Promise.resolve()

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function waitForRequestSlot() {
  const slot = requestQueue.then(async () => {
    await sleep(Math.max(0, nextRequestAt - Date.now()))
    nextRequestAt = Date.now() + MIN_REQUEST_INTERVAL_MS
  })
  requestQueue = slot
  return slot
}

async function awFetchWithRetry(url: string, headers: Record<string, string>, maxRetries = 8): Promise<Response | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    await waitForRequestSlot()
    const res = await fetch(url, { headers }).catch((e: Error) => ({ ok: false, status: 0, text: async () => e.message } as unknown as Response))
    if (res.ok) return res
    if (res.status === 404) return null
    const wait = Math.min(60000, 1500 * Math.pow(2, attempt))
    console.log(`  ${res.status} on ${url}, backing off ${wait}ms`)
    await sleep(wait)
  }
  throw new Error(`fetch ${url} exhausted retries`)
}

export async function awJson<T>(url: string): Promise<T> {
  const res = await awFetchWithRetry(url, { 'User-Agent': AW_UA, Accept: 'application/json' })
  if (!res) throw new Error(`fetch ${url} 404`)
  return (await res.json()) as T
}

export async function awText(url: string): Promise<string> {
  const res = await awFetchWithRetry(url, { 'User-Agent': AW_UA })
  if (!res) return ''
  return await res.text()
}
