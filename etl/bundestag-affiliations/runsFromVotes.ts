import { db } from '@machtblick/db/client'
import { sql } from 'drizzle-orm'
import { canonicalPartyToken } from '../_shared/parties.ts'

export type PartyRun = {
  memberId: string
  party: string
  firstDate: string
  lastDate: string
}

export function loadPartyRuns(termId: number): PartyRun[] {
  const rows = db.all(sql`
    SELECT vm.member_id AS memberId, vm.party AS party, v.date AS date
    FROM vote_members vm
    JOIN votes v ON v.id = vm.vote_id
    WHERE v.term_id = ${termId}
    ORDER BY vm.member_id ASC, v.date ASC
  `) as Array<{ memberId: string; party: string; date: string }>
  const runs: PartyRun[] = []
  for (const r of rows) {
    const party = canonicalPartyToken(r.party) ?? r.party
    const current = runs[runs.length - 1]
    if (current?.memberId === r.memberId && current.party === party) current.lastDate = r.date
    else runs.push({ memberId: r.memberId, party, firstDate: r.date, lastDate: r.date })
  }
  return runs
}
