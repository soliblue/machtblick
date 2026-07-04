import Database from 'better-sqlite3'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dipList } from '../etl/dip/client.ts'
import { normalizeInitiatorTokens } from '../etl/dip/initiatorAligns'
import { parseProposingParty } from './parseProposingParty'
import { matchParty } from './partyPatterns'

const dryRun = process.argv.includes('--dry-run')
const db = new Database(fileURLToPath(new URL('./machtblick.sqlite', import.meta.url)))
const CACHE = fileURLToPath(new URL('../etl/bundestag/handzeichen/drucksachen/', import.meta.url))
mkdirSync(CACHE, { recursive: true })

const PROPOSER_MAP: Record<string, string> = {
  'CDU/CSU': 'CDU/CSU',
  CDU: 'CDU/CSU',
  CSU: 'CDU/CSU',
  SPD: 'SPD',
  AfD: 'AfD',
  'B90/GR': 'B90/Grüne',
  'GRÜNE': 'B90/Grüne',
  'BÜNDNIS 90/DIE GRÜNEN': 'B90/Grüne',
  LINKE: 'Die Linke',
  'DIE LINKE.': 'Die Linke',
  'DIE LINKE. (Gruppe)': 'Die Linke',
  PDS: 'Die Linke',
  'PDS (Gruppe)': 'Die Linke',
  'PDS/LL': 'Die Linke',
  'PDS/LL (Gruppe)': 'Die Linke',
  'B90/GR (Gruppe)': 'B90/Grüne',
  BSW: 'BSW',
  'BSW (Gruppe)': 'BSW',
  FDP: 'FDP',
  'F.D.P.': 'FDP',
  BRg: 'Bundesregierung',
  BR: 'Bundesrat',
}
const KNOWN_COMMITTEES = new Set(['AfLEH', 'AfWE', 'PetA', 'AfRechtVer', 'FinanzA', 'HaushA', 'InnenA', 'AfG', 'VerkA', 'AfWIuG', 'VgA', 'AfU', 'BRHPräs', 'ADi', 'AuswA', 'BMF', 'BauA', 'WahlprüfA', 'WPA', 'VermA', 'AfBFSFJ', 'AfArbSoz'])
const SOURCE_TYPES = new Set(['Antrag', 'Gesetzentwurf', 'Entschließungsantrag', 'Änderungsantrag'])
const unmapped = new Set<string>()

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function getCached(name: string, path: string, params: Record<string, string>) {
  const file = join(CACHE, `${name}.json`)
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'))
  const data = await dipList<Record<string, unknown>>(path, { ...params, format: 'json' })
  writeFileSync(file, JSON.stringify(data, null, 2))
  await sleep(120)
  return data
}

function proposerFromUrheber(urheber: Array<{ bezeichnung: string }> | undefined) {
  for (const u of urheber ?? []) {
    if (PROPOSER_MAP[u.bezeichnung]) return PROPOSER_MAP[u.bezeichnung]
    if (!KNOWN_COMMITTEES.has(u.bezeichnung)) unmapped.add(u.bezeichnung)
  }
  return null
}

const BREG_RE = /(?:Antrag|Gesetzentwurf|Entwurf eines Gesetzes)(?:e?s)?\s+der\s+Bundesregierung/i
const BRAT_RE = /(?:Antrag|Gesetzentwurf|Entwurf eines Gesetzes)(?:e?s)?\s+des\s+Bundesrates/i
const FRAK_RE = /Fraktion(?:en)?\s+(?:der\s+|des\s+)?([^()]+?)(?:[:,(]|$|\s+(?:zu|zum|zur|Entwurf|Drucksache))/i

function earliestProposer(text: string) {
  const hits: Array<[number, string]> = []
  const breg = text.match(BREG_RE)
  if (breg?.index !== undefined) hits.push([breg.index, 'Bundesregierung'])
  const brat = text.match(BRAT_RE)
  if (brat?.index !== undefined) hits.push([brat.index, 'Bundesrat'])
  const frak = text.match(FRAK_RE)
  if (frak?.index !== undefined) {
    const party = matchParty(frak[1])
    if (party) hits.push([frak.index, party])
  }
  hits.sort((a, b) => a[0] - b[0])
  return hits[0]?.[1] ?? null
}

async function resolveViaDip(dnr: string): Promise<string | null> {
  const res = await getCached(`d-${dnr.replace('/', '-')}`, '/drucksache', { 'f.dokumentnummer': dnr })
  const docs = res.documents ?? []
  const doc = docs.find((d: { herausgeber?: string }) => d.herausgeber === 'BT') ?? docs[0]
  if (!doc) return null
  const direct = SOURCE_TYPES.has(doc.drucksachetyp) ? proposerFromUrheber(doc.urheber) : null
  if (direct) return direct
  const fromText = earliestProposer(doc.titel ?? '')
  if (fromText) return fromText
  const vId = doc.vorgangsbezug?.[0]?.id
  if (!vId) return null
  const vg = await getCached(`vg-${vId}`, `/vorgang/${vId}`, {})
  for (const raw of vg.initiative ?? []) {
    if (/\bPDS\b/i.test(raw)) return 'Die Linke'
    const token = [...normalizeInitiatorTokens(raw)][0]
    if (token) return token
  }
  return null
}

const DNR_RE = /(?<![\d/])(\d{1,2}\/\d{1,6})(?![\d/])/g
const HAUSHALT_RE = /^(Einzelplan\s+\d|Haushaltsgesetz|Bundeshaushaltsplan|Finanzplan des Bundes|Haushaltsbegleitgesetz|Haushaltbegleitgesetz)/i
const MP_GROUP_RE = /weiterer Abgeordneter|mehrerer Abgeordneter|Antrag der Abgeordneten/i

const rows = db.prepare(`
  SELECT id, title, document FROM votes
  WHERE (initiator IS NULL OR initiator = '') AND is_petition_bundle = 0 AND procedural = 0
  ORDER BY date
`).all() as Array<{ id: string; title: string; document: string | null }>
const docsFor = db.prepare(`SELECT label, title FROM vote_documents WHERE vote_id = ? ORDER BY id`)
const update = db.prepare(`UPDATE votes SET initiator = ? WHERE id = ?`)

console.log(`${rows.length} votes without initiator (excluding petition bundles + procedural)`)

const counts = { document: 0, voteDocs: 0, dip: 0, haushalt: 0, mpGroup: 0, unresolved: 0 }
const unresolvedSamples: string[] = []

for (const v of rows) {
  if (MP_GROUP_RE.test(v.document ?? '') || MP_GROUP_RE.test(v.title)) {
    counts.mpGroup++
    continue
  }
  const voteDocs = docsFor.all(v.id) as Array<{ label: string; title: string }>
  let source = ''
  let initiator = parseProposingParty(v.document)
  if (initiator === 'Petitionsausschuss' || initiator === 'Wahlprüfungsausschuss') initiator = null
  if (initiator) source = 'document'
  if (!initiator) {
    for (const d of voteDocs) {
      initiator = earliestProposer(d.title)
      if (initiator) break
    }
    if (initiator) source = 'voteDocs'
  }
  if (!initiator) {
    const dnrs = [...new Set([
      ...[...(v.document ?? '').matchAll(DNR_RE)].map((m) => m[1]),
      ...voteDocs.map((d) => d.label.trim()).filter((l) => /^\d{1,2}\/\d{1,6}$/.test(l)),
    ])]
    for (const dnr of dnrs) {
      initiator = await resolveViaDip(dnr)
      if (initiator) break
    }
    if (initiator) source = 'dip'
  }
  if (!initiator && HAUSHALT_RE.test(v.title) && !/Änderungsantrag|Entschließungsantrag/i.test(v.title)) {
    initiator = 'Bundesregierung'
    source = 'haushalt'
  }
  if (initiator) {
    counts[source as keyof typeof counts]++
    if (!dryRun) update.run(initiator, v.id)
    if (dryRun) console.log(`  ${source.padEnd(8)} ${initiator.padEnd(16)} ${v.id}`)
  } else {
    counts.unresolved++
    if (unresolvedSamples.length < 30) unresolvedSamples.push(`${v.id} :: ${(v.document ?? v.title).slice(0, 90)}`)
  }
}

console.log(`resolved: document=${counts.document} voteDocs=${counts.voteDocs} dip=${counts.dip} haushalt=${counts.haushalt} mpGroupSkipped=${counts.mpGroup} unresolved=${counts.unresolved}${dryRun ? ' (dry run, nothing written)' : ''}`)
if (unmapped.size) console.warn(`unmapped DIP bezeichnungen: ${[...unmapped].join(', ')}`)
if (counts.unresolved) {
  console.log('unresolved samples:')
  for (const s of unresolvedSamples) console.log(`  ${s}`)
}
db.close()
