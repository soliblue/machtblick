import { db } from '@machtblick/db/client'
import { memberAbgeordnetenwatch } from '@machtblick/db/schema'
import { sql } from 'drizzle-orm'
import { parseSex, type MemberSex } from '@/lib/memberFacets'

export function loadDemographics(): Map<string, { yearOfBirth: number | null; sex: MemberSex | null }> {
  const rows = db
    .select({
      memberId: memberAbgeordnetenwatch.memberId,
      yearOfBirth: sql<number | null>`json_extract(${memberAbgeordnetenwatch.rawJson}, '$.year_of_birth')`,
      sex: sql<string | null>`json_extract(${memberAbgeordnetenwatch.rawJson}, '$.sex')`,
    })
    .from(memberAbgeordnetenwatch)
    .all()
  return new Map(rows.map((r) => [r.memberId, { yearOfBirth: r.yearOfBirth ?? null, sex: parseSex(r.sex) }]))
}
