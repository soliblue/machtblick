import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import Database from 'better-sqlite3'

const API = 'https://search.dip.bundestag.de/api/v1'
const KEY = process.env.DIP_API_KEY ?? 'JuUJMTh.aode9HMRTazR7NwudVElhD26LeNADLxxST'
const CACHE = new URL('./drucksachen/', import.meta.url).pathname
await mkdir(CACHE, { recursive: true })

const PROPOSER_MAP = {
  'CDU/CSU': 'CDU/CSU',
  SPD: 'SPD',
  AfD: 'AfD',
  'B90/GR': 'B90/Grüne',
  LINKE: 'Die Linke',
  BSW: 'BSW',
  FDP: 'FDP',
  BRg: 'Bundesregierung',
  BR: 'Bundesrat',
}

const KNOWN_COMMITTEES = new Set(['AfLEH', 'AfWE', 'PetA', 'AfRechtVer', 'FinanzA', 'HaushA', 'InnenA', 'AfG', 'VerkA', 'AfWIuG', 'VgA', 'AfU', 'BRHPräs', 'ADi', 'AuswA', 'BMF', 'BauA', 'WahlprüfA', 'VermA', 'AfBFSFJ', 'AfArbSoz'])
const unknownBezeichnungen = new Set()

function proposerFromUrheber(urheber) {
  for (const u of urheber ?? []) {
    if (PROPOSER_MAP[u.bezeichnung]) return PROPOSER_MAP[u.bezeichnung]
    if (!KNOWN_COMMITTEES.has(u.bezeichnung)) unknownBezeichnungen.add(u.bezeichnung)
  }
  return null
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function dipFetch(url) {
  let attempt = 0
  while (true) {
    const res = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'machtblick-etl/0.1 (https://github.com/soli/machtblick)' } })
    const text = await res.text()
    if (text.startsWith('{')) return JSON.parse(text)
    attempt++
    if (attempt > 30) throw new Error(`DIP non-JSON after ${attempt} retries: ${url}`)
    await sleep(Math.min(300000, 10000 * attempt))
  }
}

async function getCached(name, fetcher) {
  const path = join(CACHE, `${name}.json`)
  try { return JSON.parse(await readFile(path, 'utf8')) } catch {}
  const data = await fetcher()
  await writeFile(path, JSON.stringify(data, null, 2))
  await sleep(120)
  return data
}

async function fetchDrucksache(dnr) {
  return getCached(`d-${dnr.replace('/', '-')}`, () =>
    dipFetch(`${API}/drucksache?apikey=${KEY}&f.dokumentnummer=${encodeURIComponent(dnr)}&format=json`),
  )
}

async function fetchVorgangDrucksachen(vId) {
  return getCached(`v-${vId}`, () =>
    dipFetch(`${API}/drucksache?apikey=${KEY}&f.vorgang=${vId}&format=json`),
  )
}

async function resolveProposer(dnr) {
  const res = await fetchDrucksache(dnr)
  const doc = res.documents?.[0]
  if (!doc) return null
  const direct = proposerFromUrheber(doc.urheber)
  if (direct) return direct
  const vId = doc.vorgangsbezug?.[0]?.id
  if (!vId) return null
  const v = await fetchVorgangDrucksachen(vId)
  for (const d of v.documents ?? []) {
    if (d.drucksachetyp === 'Antrag' || d.drucksachetyp === 'Gesetzentwurf') {
      const p = proposerFromUrheber(d.urheber)
      if (p) return p
    }
  }
  return null
}

const db = new Database('/Users/soli/machtblick/db/machtblick.sqlite')
const rows = db.prepare("SELECT id, document FROM votes WHERE vote_type IN ('handzeichen','hammelsprung') AND document IS NOT NULL AND document NOT LIKE 'Antrag%' AND document NOT LIKE 'Gesetzentwurf%'").all()
console.log(`processing ${rows.length} votes`)

const upd = db.prepare('UPDATE votes SET document = ? WHERE id = ?')
let resolved = 0
let none = 0
for (const r of rows) {
  const dnrs = [...r.document.matchAll(/\b(\d+\/\d+)\b/g)].map((m) => m[1])
  if (!dnrs.length) { none++; continue }
  let proposer = null
  for (const d of dnrs) {
    proposer = await resolveProposer(d)
    if (proposer) break
  }
  if (proposer) {
    const dStr = `Drucksache ${dnrs.join(', ')}`
    const newDoc = proposer === 'Bundesregierung'
      ? `Antrag der Bundesregierung (${dStr})`
      : proposer === 'Bundesrat'
      ? `Antrag des Bundesrates (${dStr})`
      : `Antrag der Fraktion der ${proposer} (${dStr})`
    upd.run(newDoc, r.id)
    resolved++
  } else none++
  if ((resolved + none) % 25 === 0) console.log(`  ${resolved + none}/${rows.length} (resolved ${resolved})`)
}
console.log(`done. resolved: ${resolved}, no proposer: ${none}`)
if (unknownBezeichnungen.size) {
  console.warn(`⚠ unmapped bezeichnungen encountered: ${[...unknownBezeichnungen].join(', ')}`)
  console.warn(`  add them to PROPOSER_MAP or KNOWN_COMMITTEES and re-run`)
  process.exitCode = 1
}
