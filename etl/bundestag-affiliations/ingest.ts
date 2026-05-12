import { db } from '@machtblick/db/client'
import { memberAffiliations, members } from '@machtblick/db/schema'
import { sql } from 'drizzle-orm'
import { fetchAwMandates, fetchParliamentPeriodStart } from './awFractions.ts'
import { buildAwMatcher } from './matchAwToMember.ts'
import { loadPartyRuns, type PartyRun } from './runsFromVotes.ts'

function previousDay(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

const periodStart = await fetchParliamentPeriodStart()
const awMandates = await fetchAwMandates()
const memberIdRows = db.all(sql`SELECT id FROM ${members}`) as Array<{ id: string }>
const memberIds = new Set(memberIdRows.map((r) => r.id))
const matchAw = buildAwMatcher(memberIds)
const awByMemberId = new Map<string, { validFrom: string; toFraction: string }>()
for (const aw of awMandates) {
  if (!aw.currentValidFrom) continue
  const id = matchAw(aw.politicianLabel)
  if (!id) continue
  awByMemberId.set(id, { validFrom: aw.currentValidFrom, toFraction: aw.currentFraction })
}
console.log(`AW mandates with mid-period change: ${awByMemberId.size}; unmatched: ${matchAw.unmatched().length}`)
for (const u of matchAw.unmatched()) console.log(`  unmatched: ${u}`)

const runs = loadPartyRuns()
const byMember = new Map<string, PartyRun[]>()
for (const r of runs) {
  const list = byMember.get(r.memberId) ?? []
  list.push(r)
  byMember.set(r.memberId, list)
}

const rowsToInsert: Array<{ memberId: string; party: string; validFrom: string; validTo: string | null }> = []
for (const [memberId, list] of byMember) {
  const aw = awByMemberId.get(memberId)
  for (let i = 0; i < list.length; i++) {
    const run = list[i]
    const next = list[i + 1]
    const isFirst = i === 0
    const isFlipBoundary = next && aw && aw.toFraction === next.party
    const validFrom = isFirst
      ? (aw && aw.toFraction === run.party ? aw.validFrom : periodStart)
      : (aw && aw.toFraction === run.party ? aw.validFrom : run.firstDate)
    const validTo = next
      ? (isFlipBoundary ? previousDay(aw.validFrom) : previousDay(next.firstDate))
      : null
    rowsToInsert.push({ memberId, party: run.party, validFrom, validTo })
  }
}

db.transaction((tx) => {
  tx.run(sql`DELETE FROM ${memberAffiliations}`)
  for (const row of rowsToInsert) tx.insert(memberAffiliations).values(row).run()
})

console.log(`Inserted ${rowsToInsert.length} affiliation rows for ${byMember.size} members`)
