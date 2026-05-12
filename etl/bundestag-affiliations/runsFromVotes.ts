import { db } from '@machtblick/db/client'
import { sql } from 'drizzle-orm'

export type PartyRun = {
  memberId: string
  party: string
  firstDate: string
  lastDate: string
}

export function loadPartyRuns(): PartyRun[] {
  const rows = db.all(sql`
    SELECT vm.member_id AS memberId, vm.party AS party, v.date AS date
    FROM vote_members vm
    JOIN votes v ON v.id = vm.vote_id
    ORDER BY vm.member_id ASC, v.date ASC
  `) as Array<{ memberId: string; party: string; date: string }>
  const runs: PartyRun[] = []
  let current: PartyRun | null = null
  for (const r of rows) {
    const continuesRun = current && current.memberId === r.memberId && current.party === r.party
    if (continuesRun && current) {
      current.lastDate = r.date
      continue
    }
    current = { memberId: r.memberId, party: r.party, firstDate: r.date, lastDate: r.date }
    runs.push(current)
  }
  return runs
}
