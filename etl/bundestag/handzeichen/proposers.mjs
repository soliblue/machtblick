import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import Database from 'better-sqlite3'

const API = 'https://search.dip.bundestag.de/api/v1'
const KEY = process.env.DIP_API_KEY ?? 'JuUJMTh.aode9HMRTazR7NwudVElhD26LeNADLxxST'
const CACHE = new URL('./drucksachen/', import.meta.url).pathname
let enodiaCookie = ''
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

const KNOWN_COMMITTEES = new Set(['AfLEH', 'AfWE', 'PetA', 'AfRechtVer', 'FinanzA', 'HaushA', 'InnenA', 'AfG', 'VerkA', 'AfWIuG', 'VgA', 'AfU', 'BRHPräs', 'ADi', 'AuswA', 'BMF', 'BauA', 'WahlprüfA', 'WPA', 'VermA', 'AfBFSFJ', 'AfArbSoz'])
const SOURCE_TYPES = new Set(['Antrag', 'Gesetzentwurf', 'Entschließungsantrag', 'Änderungsantrag'])
const unknownBezeichnungen = new Set()

function proposerFromUrheber(urheber) {
  for (const u of urheber ?? []) {
    if (PROPOSER_MAP[u.bezeichnung]) return PROPOSER_MAP[u.bezeichnung]
    if (!KNOWN_COMMITTEES.has(u.bezeichnung)) unknownBezeichnungen.add(u.bezeichnung)
  }
  return null
}

function proposerFromText(text) {
  if (!text) return null
  if (/(?:Antrag|Gesetzentwurf|Entwurf eines Gesetzes)(?:es)?\s+der\s+Bundesregierung/i.test(text)) return 'Bundesregierung'
  if (/(?:Antrag|Gesetzentwurf|Entwurf eines Gesetzes)(?:es)?\s+des\s+Bundesrates/i.test(text)) return 'Bundesrat'
  const fraktion = text.match(/Fraktion(?:en)?\s+(?:der\s+|des\s+)?([^()]+?)(?:[:,(]|$|\s+(?:zu|zum|zur|Entwurf|Drucksache)|\s+-)/i)
  if (!fraktion) return null
  return partyFromText(fraktion[1])
}

function partyFromText(text) {
  const value = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (value.includes('cdu/csu') || value.includes('cdu csu')) return 'CDU/CSU'
  if (value.includes('bundnis 90') || value.includes('grunen') || value.includes('b90')) return 'B90/Grüne'
  if (value.includes('die linke')) return 'Die Linke'
  if (/\bspd\b/.test(value)) return 'SPD'
  if (/\bafd\b/.test(value)) return 'AfD'
  if (/\bfdp\b/.test(value)) return 'FDP'
  if (/\bbsw\b/.test(value)) return 'BSW'
  return null
}

function sourceType(doc) {
  if (doc?.drucksachetyp === 'Gesetzentwurf') return 'Gesetzentwurf'
  if (SOURCE_TYPES.has(doc?.drucksachetyp)) return 'Antrag'
  return /Gesetzentwurf|Entwurf eines Gesetzes/i.test(doc?.titel ?? '') ? 'Gesetzentwurf' : 'Antrag'
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function dipFetch(url) {
  let attempt = 0
  while (true) {
    const headers = { accept: 'application/json', 'user-agent': 'machtblick-etl/0.1 (https://github.com/soli/machtblick)' }
    if (enodiaCookie) headers.cookie = enodiaCookie
    const res = await fetch(url, { headers })
    const text = await res.text()
    if (text.startsWith('{')) return JSON.parse(text)
    if (text.includes('Enodia Verification')) {
      await updateEnodiaCookie(text)
      continue
    }
    attempt++
    if (attempt > 30) throw new Error(`DIP non-JSON after ${attempt} retries: ${url}`)
    await sleep(Math.min(300000, 10000 * attempt))
  }
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
  const direct = SOURCE_TYPES.has(doc.drucksachetyp) ? proposerFromUrheber(doc.urheber) : null
  if (direct) return { proposer: direct, type: sourceType(doc) }
  const fromText = proposerFromText(doc.titel)
  if (fromText) return { proposer: fromText, type: sourceType(doc) }
  const vId = doc.vorgangsbezug?.[0]?.id
  if (!vId) return null
  const v = await fetchVorgangDrucksachen(vId)
  for (const d of v.documents ?? []) {
    if (String(d.vorgangsbezug?.[0]?.id ?? '') !== String(vId)) continue
    if (!SOURCE_TYPES.has(d.drucksachetyp)) continue
    const p = proposerFromUrheber(d.urheber) ?? proposerFromText(d.titel)
    if (p) return { proposer: p, type: sourceType(d) }
  }
  return null
}

const db = new Database(fileURLToPath(new URL('../../../db/machtblick.sqlite', import.meta.url)))
const rows = db.prepare("SELECT id, document FROM votes WHERE vote_type IN ('handzeichen','hammelsprung') AND document IS NOT NULL").all()
console.log(`processing ${rows.length} votes`)

const upd = db.prepare('UPDATE votes SET document = ? WHERE id = ?')
let resolved = 0
let none = 0
for (const r of rows) {
  const dnrs = [...r.document.matchAll(/\b(\d+\/\d+)\b/g)].map((m) => m[1])
  if (!dnrs.length) { none++; continue }
  let proposer = null
  let type = null
  for (const d of dnrs) {
    const source = await resolveProposer(d)
    if (source) {
      proposer = source.proposer
      type = source.type
      break
    }
  }
  if (proposer) {
    const dStr = `Drucksache ${dnrs.join(', ')}`
    const newDoc = proposer === 'Bundesregierung'
      ? `${type} der Bundesregierung (${dStr})`
      : proposer === 'Bundesrat'
      ? `${type} des Bundesrates (${dStr})`
      : `${type} der Fraktion der ${proposer} (${dStr})`
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
