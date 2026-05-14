import { db } from '@machtblick/db/client'
import { antraege, voteAntraege, votes, voteDocuments } from '@machtblick/db/schema'
import { sql } from 'drizzle-orm'

type VoteRow = { id: string; document: string | null }
type VoteDocRow = { voteId: string; label: string; title: string }
type AntragRow = { id: number; drucksache: string }

const DRS_RE = /\b21\/\d{1,6}\b/g

const voteRows = db.all(sql`SELECT id, document FROM ${votes}`) as VoteRow[]
const voteDocRows = db.all(sql`SELECT vote_id as voteId, label, title FROM ${voteDocuments}`) as VoteDocRow[]
const antragRows = db.all(sql`SELECT id, drucksache FROM ${antraege} WHERE drucksache IS NOT NULL`) as AntragRow[]

const antragByDrs = new Map<string, number>()
for (const a of antragRows) {
  if (a.drucksache) antragByDrs.set(a.drucksache, a.id)
}

const docsByVote = new Map<string, VoteDocRow[]>()
for (const d of voteDocRows) {
  const list = docsByVote.get(d.voteId) ?? []
  list.push(d)
  docsByVote.set(d.voteId, list)
}

function drucksachenFor(v: VoteRow) {
  const acc = new Set<string>()
  const collect = (s: string | null | undefined) => {
    if (!s) return
    const matches = s.match(DRS_RE)
    if (matches) for (const m of matches) acc.add(m)
  }
  collect(v.document)
  for (const d of docsByVote.get(v.id) ?? []) {
    collect(d.label)
    collect(d.title)
  }
  return [...acc]
}

const links: { voteId: string; antragId: number }[] = []
const linkedVotes = new Set<string>()
for (const v of voteRows) {
  for (const drs of drucksachenFor(v)) {
    const aid = antragByDrs.get(drs)
    if (!aid) continue
    links.push({ voteId: v.id, antragId: aid })
    linkedVotes.add(v.id)
  }
}

db.transaction((tx) => {
  tx.run(sql`DELETE FROM ${voteAntraege}`)
  for (const l of links) tx.insert(voteAntraege).values(l).onConflictDoNothing().run()
})

console.log(`vote_antraege: ${voteRows.length} votes scanned, ${linkedVotes.size} with >=1 link, ${links.length} total link rows`)
