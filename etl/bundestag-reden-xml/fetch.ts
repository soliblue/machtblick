import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const force = process.argv.includes('--force')
const rawDir = fileURLToPath(new URL('./raw/xml/', import.meta.url))
mkdirSync(rawDir, { recursive: true })

const url = (n: number) => `https://dserver.bundestag.de/btp/21/21${String(n).padStart(3, '0')}.xml`
const sessionNr = (body: string) => Number(body.match(/\bsitzung-nr="(\d+)"/)?.[1] ?? 0)
let enodiaCookie = ''

let n = 1
let consecutive404 = 0
let downloaded = 0
let skipped = 0

while (consecutive404 < 3) {
  const file = join(rawDir, `21${String(n).padStart(3, '0')}.xml`)
  if (!force && existsSync(file)) {
    if (sessionNr(readFileSync(file, 'utf8')) !== n) unlinkSync(file)
  }
  if (!force && existsSync(file)) {
    skipped++
    consecutive404 = 0
    n++
    continue
  }
  const res = await fetchXml(url(n))
  if (res.status === 404) {
    consecutive404++
    n++
    continue
  }
  if (!res.ok) throw new Error(`unexpected ${res.status} for ${url(n)}`)
  const body = await res.text()
  const actual = sessionNr(body)
  if (actual !== n) {
    console.log(`ignored session ${n}; upstream body is session ${actual || 'unknown'}`)
    consecutive404++
    n++
    continue
  }
  writeFileSync(file, body)
  downloaded++
  consecutive404 = 0
  console.log(`fetched session ${n}`)
  n++
}

console.log(`\ndone. downloaded=${downloaded}, skipped=${skipped}, latest complete session ${n - consecutive404 - 1}`)

async function fetchXml(target: string) {
  let attempt = 0
  while (true) {
    const headers: Record<string, string> = {}
    if (enodiaCookie) headers.cookie = enodiaCookie
    const res = await fetch(target, { headers })
    const text = await res.text()
    if (!text.includes('Enodia Verification')) return new Response(text, res)
    await updateEnodiaCookie(text)
    attempt++
    if (attempt > 3) throw new Error(`Enodia verification failed for ${target}`)
  }
}

async function updateEnodiaCookie(text: string) {
  const evl = text.match(/window\.chl = "([^"]+)"/)?.[1]
  if (!evl) throw new Error('Enodia challenge missing')
  const envelope = JSON.parse(Buffer.from(evl.split('.')[0], 'base64url').toString('utf8'))
  if (envelope.content.provider !== 'pow') throw new Error(`unsupported Enodia provider ${envelope.content.provider}`)
  const challenge = envelope.content.challenge
  let solution = 0
  while (!createHash('sha256').update(`${challenge}${solution}`).digest('hex').startsWith('0000')) solution++
  const verified = await fetch('https://dserver.bundestag.de/.enodia/verify', { method: 'POST', body: `${solution}-${evl}` })
  if (!verified.ok) throw new Error(`unexpected Enodia verify ${verified.status}`)
  const auth = await verified.text()
  enodiaCookie = `enodia=${auth}`
}
