import { sql } from 'drizzle-orm'
import { db } from '@machtblick/db/client'
import { bundestagTerms, partySeatHistory, partyLineageMembers } from '@machtblick/db/schema'
import { normalizeFractionLabel } from '../_shared/parties.ts'
import { AW_API, awJson } from '../_shared/awClient.ts'

const BUNDESTAG_PARLIAMENT_ID = 5

type ParliamentPeriod = {
  id: number
  label: string
  start_date_period: string
  end_date_period: string | null
}
type AwPeriodsResponse = { data: ParliamentPeriod[] }

type Mandate = {
  id: number
  politician: { id: number; label: string }
  start_date: string | null
  end_date: string | null
  fraction_membership: Array<{ fraction: { label: string }; valid_from: string; valid_until: string | null; label: string }> | null
}
type AwMandatesResponse = {
  meta: { result: { total: number; count: number; range_start: number; range_end: number } }
  data: Mandate[]
}

const periodsJson = await awJson<AwPeriodsResponse>(`${AW_API}/parliament-periods?type=legislature&parliament=${BUNDESTAG_PARLIAMENT_ID}&range_end=200`)
const periods = periodsJson.data.sort((a, b) => a.start_date_period.localeCompare(b.start_date_period))
console.log(`bundestag parliament-periods: ${periods.length}`)

const periodToBtNumber: Record<number, number> = {
  67: 16,
  83: 17,
  97: 18,
  111: 19,
  132: 20,
  161: 21,
}

for (const period of periods) {
  const btNumber = periodToBtNumber[period.id]
  if (!btNumber) {
    console.log(`  skip period ${period.id} (${period.label}) - no Bundestag-number mapping`)
    continue
  }
  const mandates = await fetchAllMandates(period.id)
  const seatsByParty = new Map<string, number>()
  const unmapped = new Map<string, number>()
  for (const m of mandates) {
    const fm = m.fraction_membership ?? []
    if (!fm.length) continue
    const partyName = normalizeFractionLabel(fm[0].fraction.label)
    if (!partyName) {
      unmapped.set(fm[0].fraction.label, (unmapped.get(fm[0].fraction.label) ?? 0) + 1)
      continue
    }
    seatsByParty.set(partyName, (seatsByParty.get(partyName) ?? 0) + 1)
  }
  if (unmapped.size) {
    console.log(`  unmapped fraction labels in BT${btNumber}:`)
    for (const [k, v] of unmapped) console.log(`    ${v}x ${JSON.stringify(k)}`)
  }
  const totalSeats = Array.from(seatsByParty.values()).reduce((a, b) => a + b, 0)

  db.insert(bundestagTerms).values({
    id: btNumber,
    number: btNumber,
    startDate: period.start_date_period,
    endDate: period.end_date_period,
    totalSeats,
  }).onConflictDoUpdate({
    target: bundestagTerms.id,
    set: { startDate: period.start_date_period, endDate: period.end_date_period, totalSeats },
  }).run()

  const lineageByPartyInPeriod = buildLineageLookup(period.start_date_period, period.end_date_period)
  db.run(sql`DELETE FROM party_seat_history WHERE term_id = ${btNumber}`)
  for (const [partyName, seats] of seatsByParty) {
    const lineageId = lineageByPartyInPeriod(partyName)
    db.insert(partySeatHistory).values({
      termId: btNumber,
      partyName,
      seats,
      pctOfTotal: seats / totalSeats,
      lineageId,
    }).run()
  }

  console.log(`  BT${btNumber} (${period.start_date_period}..${period.end_date_period ?? 'current'}): ${totalSeats} seats across ${seatsByParty.size} parties`)
  for (const [partyName, seats] of [...seatsByParty.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${seats.toString().padStart(4)} ${partyName}`)
  }
}

function buildLineageLookup(periodStart: string, periodEnd: string | null) {
  const rows = db.select({
    lineageId: partyLineageMembers.lineageId,
    partyName: partyLineageMembers.partyName,
    validFrom: partyLineageMembers.validFrom,
    validTo: partyLineageMembers.validTo,
  }).from(partyLineageMembers).all()
  const periodEndEffective = periodEnd ?? '9999-12-31'
  return (partyName: string): string | null => {
    const hit = rows.find((r) => r.partyName === partyName && r.validFrom <= periodEndEffective && (r.validTo == null || r.validTo >= periodStart))
    return hit?.lineageId ?? null
  }
}

async function fetchAllMandates(periodId: number): Promise<Mandate[]> {
  const json = await awJson<AwMandatesResponse>(`${AW_API}/candidacies-mandates?parliament_period=${periodId}&type=mandate&range_start=0&range_end=1000`)
  if (json.meta.result.total > 1000) throw new Error(`period ${periodId} has ${json.meta.result.total} mandates, exceeds AW page cap of 1000`)
  return json.data
}
