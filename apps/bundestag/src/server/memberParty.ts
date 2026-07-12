import { db } from '@machtblick/db/client'
import { memberAffiliations } from '@machtblick/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { CURRENT_TERM } from './term'

export function getCurrentPartyMap(): Map<string, string> {
  const rows = db
    .select({ memberId: memberAffiliations.memberId, party: memberAffiliations.party })
    .from(memberAffiliations)
    .where(and(eq(memberAffiliations.termId, CURRENT_TERM), isNull(memberAffiliations.validTo)))
    .all()
  return new Map(rows.map((r) => [r.memberId, r.party]))
}

export type AffiliationRow = { memberId: string; party: string; validFrom: string; validTo: string | null }

export function loadAffiliationsByMember(): Map<string, AffiliationRow[]> {
  const rows = db.select().from(memberAffiliations).where(eq(memberAffiliations.termId, CURRENT_TERM)).all() as AffiliationRow[]
  const byMember = new Map<string, AffiliationRow[]>()
  for (const r of rows) {
    const arr = byMember.get(r.memberId) ?? []
    arr.push(r)
    byMember.set(r.memberId, arr)
  }
  return byMember
}

export function partyAt(list: AffiliationRow[] = [], date: string): string {
  return list.find((a) => a.validFrom <= date && (a.validTo === null || a.validTo >= date))?.party ?? ''
}
