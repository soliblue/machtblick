import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { hasProtocolText } from './protocolSource.mjs'

const API = 'https://search.dip.bundestag.de/api/v1'
const KEY = process.env.DIP_API_KEY ?? 'JuUJMTh.aode9HMRTazR7NwudVElhD26LeNADLxxST'
const OUT = new URL('./raw/', import.meta.url).pathname
let enodiaCookie = ''

await mkdir(OUT, { recursive: true })
const existing = new Set((await readdir(OUT)).map((f) => f.replace(/\.xml$/, '')))

const list = await fetchJson(`${API}/plenarprotokoll?apikey=${KEY}&f.wahlperiode=21&f.zuordnung=BT&format=json`)
console.log(`api lists ${list.numFound} protocols`)

for (const doc of list.documents) {
  const key = doc.dokumentnummer.replace('/', '-')
  const path = join(OUT, `${key}.xml`)
  if (existing.has(key) && hasProtocolText(await readFile(path, 'utf8'))) continue
  const xml = await fetchText(`${API}/plenarprotokoll-text/${doc.id}?apikey=${KEY}&format=xml`)
  if (!hasProtocolText(xml)) throw new Error(`protocol text missing for ${doc.dokumentnummer}`)
  await writeFile(path, xml)
  console.log(`${existing.has(key) ? 'refetched' : 'fetched'} ${doc.dokumentnummer} (${doc.datum})`)
}

async function fetchText(url) {
  let text = await fetch(url, enodiaCookie ? { headers: { cookie: enodiaCookie } } : {}).then((r) => r.text())
  if (text.includes('Enodia Verification')) {
    await updateEnodiaCookie(text)
    text = await fetch(url, { headers: { cookie: enodiaCookie } }).then((r) => r.text())
  }
  return text
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url))
}

async function updateEnodiaCookie(text) {
  const evl = text.match(/window\.chl = "([^"]+)"/)?.[1]
  if (!evl) throw new Error('Enodia challenge missing')
  const envelope = JSON.parse(Buffer.from(evl.split('.')[0], 'base64').toString('utf8'))
  const challenge = envelope.content.challenge
  let solution = 0
  while (!createHash('sha256').update(`${challenge}${solution}`).digest('hex').startsWith('0000')) solution++
  const auth = await fetch('https://search.dip.bundestag.de/.enodia/verify', { method: 'POST', body: `${solution}-${evl}` }).then((r) => r.text())
  enodiaCookie = `enodia=${auth}`
}
