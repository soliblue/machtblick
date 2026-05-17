import { db } from '@machtblick/db/client'
import { antraege, antraegeRaw, voteAntraege, votes, voteDocuments } from '@machtblick/db/schema'
import { sql } from 'drizzle-orm'
import { initiatorAligns } from './initiatorAligns'

type VoteRow = { id: string; document: string | null; initiator: string | null }
type VoteDocRow = { voteId: string; label: string; title: string }
type AntragRow = { id: number; drucksache: string; initiativeFraktion: string | null }
type RawAntragRow = { antragId: number; positionsJson: unknown }
type AntragAlias = { antrag: AntragRow; own: boolean }

const DRS_RE = /\b21\/\d{1,6}\b/g

const voteRows = db.all(sql`SELECT id, document, initiator FROM ${votes}`) as VoteRow[]
const voteDocRows = db.all(sql`SELECT vote_id as voteId, label, title FROM ${voteDocuments}`) as VoteDocRow[]
const antragRows = db.all(sql`SELECT id, drucksache, initiative_fraktion as initiativeFraktion FROM ${antraege} WHERE drucksache IS NOT NULL`) as AntragRow[]
const rawAntragRows = db.select({ antragId: antraegeRaw.antragId, positionsJson: antraegeRaw.positionsJson }).from(antraegeRaw).all() as RawAntragRow[]

const rawByAntrag = new Map(rawAntragRows.map((r) => [r.antragId, r]))
const antraegeByDrs = new Map<string, Map<number, AntragAlias>>()
const ownAntraegeByDrs = new Map<string, AntragRow>()

const docsByVote = new Map<string, VoteDocRow[]>()
for (const d of voteDocRows) {
  const list = docsByVote.get(d.voteId) ?? []
  list.push(d)
  docsByVote.set(d.voteId, list)
}

function extractDrs(s: string | null | undefined) {
  const out = new Set<string>()
  const m = s?.match(DRS_RE)
  if (m) for (const x of m) out.add(x)
  return out
}

function positionDrucksachen(value: unknown) {
  const out = new Set<string>()
  if (Array.isArray(value)) {
    for (const position of value) {
      if (position && typeof position === 'object' && 'fundstelle' in position) {
        const fundstelle = position.fundstelle
        const typ = fundstelle && typeof fundstelle === 'object' && 'drucksachetyp' in fundstelle ? fundstelle.drucksachetyp : null
        if (fundstelle && typeof fundstelle === 'object' && 'dokumentart' in fundstelle && fundstelle.dokumentart === 'Drucksache' && typeof typ === 'string' && typ.includes('Beschlussempfehl') && 'dokumentnummer' in fundstelle) {
          for (const x of extractDrs(typeof fundstelle.dokumentnummer === 'string' ? fundstelle.dokumentnummer : null)) out.add(x)
        }
      }
    }
  }
  return out
}

function addAlias(drs: string, antrag: AntragRow, own: boolean) {
  if (own) ownAntraegeByDrs.set(drs, antrag)
  const group = antraegeByDrs.get(drs) ?? new Map<number, AntragAlias>()
  const existing = group.get(antrag.id)
  group.set(antrag.id, { antrag, own: own || existing?.own === true })
  antraegeByDrs.set(drs, group)
}

for (const a of antragRows) {
  addAlias(a.drucksache, a, true)
  for (const d of positionDrucksachen(rawByAntrag.get(a.id)?.positionsJson)) addAlias(d, a, false)
}

function antragMatches(drs: Iterable<string>) {
  const out = new Map<number, AntragAlias>()
  for (const d of drs) {
    for (const alias of antraegeByDrs.get(d)?.values() ?? []) {
      const existing = out.get(alias.antrag.id)
      out.set(alias.antrag.id, { antrag: alias.antrag, own: alias.own || existing?.own === true })
    }
  }
  return [...out.values()]
}

function directAntragMatches(drs: Iterable<string>) {
  const out = new Map<number, AntragAlias>()
  for (const d of drs) {
    const antrag = ownAntraegeByDrs.get(d)
    if (antrag) out.set(antrag.id, { antrag, own: true })
  }
  return [...out.values()]
}

const links: { voteId: string; antragId: number }[] = []
const linkKeys = new Set<string>()
const linkedVotes = new Set<string>()
let candidatesTotal = 0
let kept = 0
let keptViaAlias = 0
let droppedMisalign = 0
let droppedNoNormalization = 0
let fallbackVotes = 0
let fallbackLinks = 0

for (const v of voteRows) {
  const primaryDrs = extractDrs(v.document)
  const direct = directAntragMatches(primaryDrs)
  const primary = direct.length > 0 ? direct : antragMatches(primaryDrs)
  let candidates = primary
  let viaFallback = false
  if (primary.length === 0) {
    const fb = new Set<string>()
    for (const d of docsByVote.get(v.id) ?? []) {
      for (const x of extractDrs(d.label)) fb.add(x)
      for (const x of extractDrs(d.title)) fb.add(x)
    }
    const fbDirect = directAntragMatches(fb)
    const fbMatches = fbDirect.length > 0 ? fbDirect : antragMatches(fb)
    if (fbMatches.length > 0) {
      candidates = fbMatches
      viaFallback = true
    }
  }
  let voteHadKeep = false
  for (const candidate of candidates) {
    candidatesTotal += 1
    const verdict = initiatorAligns(v.initiator, candidate.antrag.initiativeFraktion)
    if (verdict.aligns) {
      kept += 1
      if (!candidate.own) keptViaAlias += 1
      const key = `${v.id} ${candidate.antrag.id}`
      if (!linkKeys.has(key)) links.push({ voteId: v.id, antragId: candidate.antrag.id })
      linkKeys.add(key)
      linkedVotes.add(v.id)
      voteHadKeep = true
      if (viaFallback) fallbackLinks += 1
      continue
    }
    if (verdict.reason === 'misalign') droppedMisalign += 1
    else droppedNoNormalization += 1
  }
  if (viaFallback && voteHadKeep) fallbackVotes += 1
}

db.transaction((tx) => {
  tx.run(sql`DELETE FROM ${voteAntraege}`)
  for (const l of links) tx.insert(voteAntraege).values(l).onConflictDoNothing().run()
})

console.log(`vote_antraege: ${voteRows.length} votes scanned, ${linkedVotes.size} with >=1 link, ${links.length} total link rows`)
console.log(`alignment filter: candidates_total=${candidatesTotal} kept=${kept} kept_via_alias=${keptViaAlias} dropped_misalign=${droppedMisalign} dropped_no_normalization=${droppedNoNormalization}`)
console.log(`fallback: ${fallbackVotes} votes recovered, ${fallbackLinks} link rows via vote_documents`)
