import { db } from '@machtblick/db/client'
import { memberAffiliations } from '@machtblick/db/schema'
import { and, eq, isNull, lte, or, gte } from 'drizzle-orm'

const CURRENT_TERM = 21

export function getMemberPartyAt(memberId: string, date: string): string {
  const row = db
    .select({ party: memberAffiliations.party })
    .from(memberAffiliations)
    .where(
      and(
        eq(memberAffiliations.memberId, memberId),
        eq(memberAffiliations.termId, CURRENT_TERM),
        lte(memberAffiliations.validFrom, date),
        or(isNull(memberAffiliations.validTo), gte(memberAffiliations.validTo, date)),
      ),
    )
    .get()
  return row?.party ?? ''
}

export function getCurrentParty(memberId: string): string {
  const row = db
    .select({ party: memberAffiliations.party })
    .from(memberAffiliations)
    .where(and(eq(memberAffiliations.memberId, memberId), eq(memberAffiliations.termId, CURRENT_TERM), isNull(memberAffiliations.validTo)))
    .get()
  return row?.party ?? ''
}

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

export function partyAt(list: AffiliationRow[] | undefined, date: string): string {
  if (!list) return ''
  const hit = list.find((a) => a.validFrom <= date && (a.validTo === null || a.validTo >= date))
  return hit?.party ?? ''
}
