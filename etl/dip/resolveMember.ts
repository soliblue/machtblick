import { db } from '@machtblick/db/client'
import { members } from '@machtblick/db/schema'
import { sql } from 'drizzle-orm'

const rows = db.all(sql`SELECT id, dip_person_id FROM ${members} WHERE dip_person_id IS NOT NULL`) as Array<{
  id: string
  dip_person_id: number
}>

const byDipId = new Map<number, string>()
for (const r of rows) byDipId.set(r.dip_person_id, r.id)

export function memberIdForDipPerson(dipPersonId: number) {
  return byDipId.get(dipPersonId) ?? null
}
