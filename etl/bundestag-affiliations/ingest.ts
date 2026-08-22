import { db } from '@machtblick/db/client'
import { memberAffiliations, memberMandates, members } from '@machtblick/db/schema'
import { sql } from 'drizzle-orm'
import { CURRENT_TERM } from '../../apps/bundestag/src/server/term.ts'
import { buildAffiliationRows, latestEndByMember, missingOpenMandates, type CurrentAwMandate } from './affiliationRows.ts'
import { fetchAwMandateEnd, fetchAwMandates, fetchParliamentPeriodStart } from './awFractions.ts'
import { assertCompleteCurrentMandates } from './currentMandateInvariant.ts'
import { canonicalizeLocalMandates, type CurrentMandateAssignment, type LocalAwMandate } from './mandateCanonicalization.ts'
import { buildAwMatcher } from './matchAwToMember.ts'
import { loadPartyRuns } from './runsFromVotes.ts'

const periodStart = await fetchParliamentPeriodStart()
const awMandates = await fetchAwMandates()
const runs = loadPartyRuns(CURRENT_TERM)
const localMandates = db.all(sql`
  SELECT id AS rowId, member_id AS memberId, bt_mdb_id AS btMdbId,
    aw_mandate_id AS mandateId, aw_politician_id AS politicianId,
    mandate_type AS mandateType, list_state AS listState,
    constituency_number AS constituencyNumber, constituency_name AS constituencyName,
    valid_from AS validFrom, valid_to AS validTo
  FROM ${memberMandates}
  WHERE term_id = ${CURRENT_TERM}
`) as LocalAwMandate[]
const memberByAwPoliticianId = new Map<number, string>()
for (const mandate of localMandates.filter((row) => row.politicianId)) {
  const existing = memberByAwPoliticianId.get(mandate.politicianId!)
  if (existing && existing !== mandate.memberId) throw new Error(`duplicate term-21 AW politician id ${mandate.politicianId}: ${existing}, ${mandate.memberId}`)
  memberByAwPoliticianId.set(mandate.politicianId!, mandate.memberId)
}
const memberRows = db.all(sql`SELECT id, bt_mdb_id AS btMdbId FROM ${members}`) as Array<{ id: string; btMdbId: string | null }>
const memberIds = new Set(memberRows.map((row) => row.id))
const btMdbIdByMember = new Map(memberRows.map((row) => [row.id, row.btMdbId]))
const matchAw = buildAwMatcher(memberIds, new Set(runs.map((run) => run.memberId)), memberByAwPoliticianId)
const currentMandates: CurrentAwMandate[] = []
const currentAssignments: CurrentMandateAssignment[] = []
for (const aw of awMandates) {
  const id = matchAw(aw.politicianLabel, aw.politicianId)
  if (!id) continue
  currentMandates.push({ memberId: id, party: aw.currentFraction, factionValidFrom: aw.currentValidFrom, mandateValidFrom: aw.mandateValidFrom })
  currentAssignments.push({ memberId: id, btMdbId: btMdbIdByMember.get(id) ?? null, politicianId: aw.politicianId, mandateId: aw.mandateId })
}
assertCompleteCurrentMandates(awMandates, currentMandates, matchAw.unmatched())
const canonicalized = canonicalizeLocalMandates(localMandates, currentAssignments)
console.log(`AW current mandates matched: ${currentMandates.length}; unique members: ${new Set(currentMandates.map((mandate) => mandate.memberId)).size}; unmatched: ${matchAw.unmatched().length}`)
for (const u of matchAw.unmatched()) console.log(`  unmatched: ${u}`)

const fetchedEnds = new Map<number, string>()
for (const mandate of missingOpenMandates(canonicalized.rows.filter((row): row is LocalAwMandate & { mandateId: number } => row.mandateId !== null), new Set(awMandates.map((row) => row.mandateId)))) {
  const end = await fetchAwMandateEnd(mandate.mandateId)
  if (end) fetchedEnds.set(mandate.mandateId, end)
}
const rowsToInsert = buildAffiliationRows(runs, currentMandates, latestEndByMember(canonicalized.rows, fetchedEnds), periodStart, CURRENT_TERM)

db.transaction((tx) => {
  for (const change of canonicalized.changes) {
    tx.update(memberMandates).set({
      memberId: change.row.memberId,
      btMdbId: change.row.btMdbId,
      awPoliticianId: change.row.politicianId,
      awMandateId: change.row.mandateId,
      mandateType: change.row.mandateType,
      listState: change.row.listState,
      constituencyNumber: change.row.constituencyNumber,
      constituencyName: change.row.constituencyName,
      validTo: change.row.validTo,
    }).where(sql`${memberMandates.id} = ${change.targetRowId ?? change.sourceRowId}`).run()
    if (change.targetRowId) tx.delete(memberMandates).where(sql`${memberMandates.id} = ${change.sourceRowId}`).run()
  }
  for (const [mandateId, validTo] of fetchedEnds) {
    tx.update(memberMandates).set({ validTo }).where(sql`${memberMandates.termId} = ${CURRENT_TERM} AND ${memberMandates.awMandateId} = ${mandateId}`).run()
  }
  tx.run(sql`DELETE FROM ${memberAffiliations} WHERE term_id = ${CURRENT_TERM}`)
  for (const row of rowsToInsert) tx.insert(memberAffiliations).values(row).run()
})

console.log(`AW departed mandate ends fetched: ${fetchedEnds.size}`)
console.log(`Inserted ${rowsToInsert.length} affiliation rows for ${new Set(rowsToInsert.map((row) => row.memberId)).size} members`)
