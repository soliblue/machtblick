import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { argValue } from '../../_shared/worker.mjs'
import { dipList } from '../../dip/client.ts'
import { pinnedSourceDrucksache } from './source.mjs'

const CACHE = new URL('./drucksachen/', import.meta.url).pathname

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

export function isDocumentsEnvelope(data) {
  return typeof data?.numFound === 'number' && Array.isArray(data.documents)
}

export async function getCached(name, fetcher, cache = CACHE) {
  const path = join(cache, `${name}.json`)
  const cached = await readFile(path, 'utf8').then(JSON.parse).catch(() => undefined)
  if (isDocumentsEnvelope(cached)) return cached
  const data = await fetcher()
  if (!isDocumentsEnvelope(data)) throw new Error(`invalid DIP documents response: ${name}`)
  await writeFile(path, JSON.stringify(data, null, 2))
  await sleep(120)
  return data
}

async function fetchDrucksache(dnr) {
  return getCached(`d-${dnr.replace('/', '-')}`, () =>
    dipList('/drucksache', { 'f.dokumentnummer': dnr, format: 'json' }),
  )
}

async function resolveProposer(dnr) {
  const res = await fetchDrucksache(dnr)
  const doc = (res.documents ?? []).find((d) => d.herausgeber === 'BT') ?? res.documents?.[0]
  if (!doc) return null
  const direct = SOURCE_TYPES.has(doc.drucksachetyp) ? proposerFromUrheber(doc.urheber) : null
  if (direct) return { proposer: direct, type: sourceType(doc) }
  const fromText = proposerFromText(doc.titel)
  if (fromText) return { proposer: fromText, type: sourceType(doc) }
  return null
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await mkdir(CACHE, { recursive: true })
  const db = new Database(fileURLToPath(new URL('../../../db/machtblick.sqlite', import.meta.url)))
  const voteFilter = argValue('--vote')
  const rows = db.prepare(`
    SELECT id, document
    FROM votes
    WHERE vote_type IN ('handzeichen','hammelsprung')
      AND document IS NOT NULL
      AND (? IS NULL OR id = ?)
  `).all(voteFilter ?? null, voteFilter ?? null)
  console.log(`processing ${rows.length} votes`)

  const upd = db.prepare('UPDATE votes SET document = ? WHERE id = ?')
  let resolved = 0
  let none = 0
  for (const r of rows) {
    const dnrs = [...r.document.matchAll(/\b(\d+\/\d+)\b/g)].map((m) => m[1])
    if (!dnrs.length) { none++; continue }
    let proposer = null
    let type = null
    const pinned = pinnedSourceDrucksache(r.id)
    const ordered = pinned ? [pinned, ...dnrs.filter((dnr) => dnr !== pinned)] : dnrs
    for (const d of ordered) {
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
}
