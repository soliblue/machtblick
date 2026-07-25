import { db } from '@machtblick/db/client'
import { memberMandates, members } from '@machtblick/db/schema'
import { sql } from 'drizzle-orm'
import { buildDipMemberResolver, type DipMemberCandidate } from './dipMemberResolver.ts'

const resolveMember = buildDipMemberResolver(db.all(sql`
  SELECT DISTINCT
    ${members.id},
    ${members.name},
    ${members.firstName} AS firstName,
    ${members.lastName} AS lastName,
    ${members.dipPersonId} AS dipPersonId
  FROM ${members}
  JOIN ${memberMandates} ON ${memberMandates.memberId} = ${members.id}
  WHERE ${memberMandates.termId} = 21
`) as DipMemberCandidate[])

export function memberIdForDipPerson(dipPersonId: number, activityTitle = '') {
  return resolveMember(dipPersonId, activityTitle)
}
