import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { and, eq, gte, isNull, lte, notInArray, or } from 'drizzle-orm'
import { db } from '@machtblick/db/client'
import { memberAffiliations, votes, votePartySummaries } from '@machtblick/db/schema'

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
let updated = 0
let skipped = 0

for (const f of files) {
  const data = JSON.parse(await readFile(join(IN, f), 'utf8'))
  if (!data.votes?.length) continue
  const termId = Number(String(data.number).match(/^\d+/)?.[0])
  const activeParties = new Set(db.select({ party: memberAffiliations.party }).from(memberAffiliations).where(and(
    eq(memberAffiliations.termId, termId),
    lte(memberAffiliations.validFrom, data.date),
    or(isNull(memberAffiliations.validTo), gte(memberAffiliations.validTo, data.date)),
  )).all().map((row) => row.party))
  for (const v of data.votes) {
    if (v.vote_type === 'namentlich') { skipped++; continue }
    const id = `pp${data.number.replace('/', '-')}-${v.index}-${slugify(v.title)}`
    const exists = db.select({ id: votes.id }).from(votes).where(eq(votes.id, id)).get()
    const all = new Set([...(v.ja ?? []), ...(v.nein ?? []), ...(v.enth ?? [])])
    const parties = [...all].filter((party) => activeParties.size === 0 || activeParties.has(party))
    db.transaction((tx) => {
      if (!exists) {
        tx.insert(votes).values({
          id,
          voteType: v.vote_type,
          date: data.date,
          title: v.title,
          isPetitionBundle: /^Sammelübersicht\s+\d+\s+zu\s+Petitionen/i.test(v.title) || /^Petitionsausschuss\s+Sammelübersicht\s+\d+/i.test(v.title),
          document: (v.drucksache ?? []).join(', ') || null,
          result: v.outcome === 'unklar' ? 'angenommen' : v.outcome,
          sourceUrl: `https://search.dip.bundestag.de/api/v1/plenarprotokoll/${data.number}`,
          fetchedAt: new Date().toISOString(),
        }).run()
      }
      if (parties.length) {
        tx.delete(votePartySummaries).where(and(eq(votePartySummaries.voteId, id), notInArray(votePartySummaries.party, parties))).run()
      } else {
        tx.delete(votePartySummaries).where(eq(votePartySummaries.voteId, id)).run()
      }
      for (const party of parties) {
        const position = v.ja?.includes(party) ? 'yes' : v.nein?.includes(party) ? 'no' : 'abstain'
        tx.insert(votePartySummaries).values({ voteId: id, party, position }).onConflictDoUpdate({
          target: [votePartySummaries.voteId, votePartySummaries.party],
          set: { position },
        }).run()
      }
    })
    if (exists) updated++
    else inserted++
  }
}

console.log(`inserted: ${inserted}, updated: ${updated}, skipped: ${skipped}`)
