import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { eq } from 'drizzle-orm'
import { db } from '@machtblick/db/client'
import { votes, votePartySummaries } from '/Users/soli/machtblick/db/schema/index.ts'

const IN = new URL('./extracted/', import.meta.url).pathname
const files = (await readdir(IN)).filter((f) => f.endsWith('.json')).sort()

function slugify(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

let inserted = 0
let skipped = 0

for (const f of files) {
  const data = JSON.parse(await readFile(join(IN, f), 'utf8'))
  if (!data.votes?.length) continue
  for (const v of data.votes) {
    if (v.vote_type === 'namentlich') { skipped++; continue }
    const id = `pp${data.number.replace('/', '-')}-${v.index}-${slugify(v.title)}`
    const exists = db.select({ id: votes.id }).from(votes).where(eq(votes.id, id)).get()
    if (exists) { skipped++; continue }
    db.transaction((tx) => {
      tx.insert(votes).values({
        id,
        voteType: v.vote_type,
        date: data.date,
        title: v.title,
        document: (v.drucksache ?? []).join(', ') || null,
        result: v.outcome === 'unklar' ? 'angenommen' : v.outcome,
        sourceUrl: `https://search.dip.bundestag.de/api/v1/plenarprotokoll/${data.number}`,
        fetchedAt: new Date().toISOString(),
      }).run()
      const all = new Set([...(v.ja ?? []), ...(v.nein ?? []), ...(v.enth ?? [])])
      for (const party of all) {
        const position = v.ja?.includes(party) ? 'yes' : v.nein?.includes(party) ? 'no' : 'abstain'
        tx.insert(votePartySummaries).values({ voteId: id, party, position }).run()
      }
    })
    inserted++
  }
}

console.log(`inserted: ${inserted}, skipped: ${skipped}`)
