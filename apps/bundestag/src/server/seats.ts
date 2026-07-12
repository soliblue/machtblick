import { db } from '@machtblick/db/client'
import { votes } from '@machtblick/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { CURRENT_TERM } from './term'

export function getChamberSize(): number {
  return db.select({ totalMembers: votes.totalMembers }).from(votes).where(and(eq(votes.termId, CURRENT_TERM), eq(votes.voteType, 'namentlich'))).orderBy(desc(votes.date)).limit(1).get()?.totalMembers ?? 0
}
