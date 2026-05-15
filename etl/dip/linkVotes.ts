import { db } from '@machtblick/db/client'
import { antraege, voteAntraege, votes, voteDocuments } from '@machtblick/db/schema'
import { sql } from 'drizzle-orm'
import { initiatorAligns } from './initiatorAligns'

type VoteRow = { id: string; document: string | null; initiator: string | null }
type VoteDocRow = { voteId: string; label: string; title: string }
type AntragRow = { id: number; drucksache: string; initiativeFraktion: string | null }

const DRS_RE = /\b21\/\d{1,6}\b/g

const voteRows = db.all(sql`SELECT id, document, initiator FROM ${votes}`) as VoteRow[]
const voteDocRows = db.all(sql`SELECT vote_id as voteId, label, title FROM ${voteDocuments}`) as VoteDocRow[]
const antragRows = db.all(sql`SELECT id, drucksache, initiative_fraktion as initiativeFraktion FROM ${antraege} WHERE drucksache IS NOT NULL`) as AntragRow[]

const antragByDrs = new Map<string, AntragRow>()
for (const a of antragRows) {
  if (a.drucksache) antragByDrs.set(a.drucksache, a)
}

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

function antragMatches(drs: Iterable<string>) {
  const out: AntragRow[] = []
  for (const d of drs) {
    const a = antragByDrs.get(d)
    if (a) out.push(a)
  }
  return out
}

const links: { voteId: string; antragId: number }[] = []
const linkedVotes = new Set<string>()
let candidatesTotal = 0
let kept = 0
let droppedMisalign = 0
let droppedNoNormalization = 0
let fallbackVotes = 0
let fallbackLinks = 0

for (const v of voteRows) {
  const primary = antragMatches(extractDrs(v.document))
  let candidates = primary
  let viaFallback = false
  if (primary.length === 0) {
    const fb = new Set<string>()
    for (const d of docsByVote.get(v.id) ?? []) {
      for (const x of extractDrs(d.label)) fb.add(x)
      for (const x of extractDrs(d.title)) fb.add(x)
    }
    const fbMatches = antragMatches(fb)
    if (fbMatches.length > 0) {
      candidates = fbMatches
      viaFallback = true
    }
  }
  let voteHadKeep = false
  for (const antrag of candidates) {
    candidatesTotal += 1
    const verdict = initiatorAligns(v.initiator, antrag.initiativeFraktion)
    if (verdict.aligns) {
      kept += 1
      links.push({ voteId: v.id, antragId: antrag.id })
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
console.log(`alignment filter: candidates_total=${candidatesTotal} kept=${kept} dropped_misalign=${droppedMisalign} dropped_no_normalization=${droppedNoNormalization}`)
console.log(`fallback: ${fallbackVotes} votes recovered, ${fallbackLinks} link rows via vote_documents`)
