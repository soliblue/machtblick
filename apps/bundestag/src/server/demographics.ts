import { db } from '@machtblick/db/client'
import { memberAbgeordnetenwatch } from '@machtblick/db/schema'
import { sql } from 'drizzle-orm'
import type { MemberSex } from './members'

export function loadDemographics(): Map<string, { yearOfBirth: number | null; sex: MemberSex | null }> {
  const rows = db
    .select({
      memberId: memberAbgeordnetenwatch.memberId,
      yearOfBirth: sql<number | null>`json_extract(${memberAbgeordnetenwatch.rawJson}, '$.year_of_birth')`,
      sex: sql<string | null>`json_extract(${memberAbgeordnetenwatch.rawJson}, '$.sex')`,
    })
    .from(memberAbgeordnetenwatch)
    .all()
  const out = new Map<string, { yearOfBirth: number | null; sex: MemberSex | null }>()
  for (const r of rows) {
    const sex = r.sex === 'm' || r.sex === 'f' || r.sex === 'd' ? r.sex : null
    out.set(r.memberId, { yearOfBirth: r.yearOfBirth ?? null, sex })
  }
  return out
}
