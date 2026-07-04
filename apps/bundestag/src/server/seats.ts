import { db } from '@machtblick/db/client'
import { votePartySummaries, votes } from '@machtblick/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { CURRENT_TERM } from './term'

export function getSeatsByParty(): Map<string, number> {
  const out = new Map<string, number>()
  const namentlich = db.select().from(votes).where(and(eq(votes.termId, CURRENT_TERM), eq(votes.voteType, 'namentlich'))).orderBy(desc(votes.date)).limit(20).all()
  for (const v of namentlich) {
    const rows = db.select().from(votePartySummaries).where(eq(votePartySummaries.voteId, v.id)).all()
    for (const r of rows) if (r.members && !out.has(r.party)) out.set(r.party, r.members)
    if (out.size >= 6) break
  }
  return out
}
