import { db } from '@machtblick/db/client'
import { members } from '@machtblick/db/schema'
import { sql } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { buildAwMatcher } from '../bundestag-affiliations/matchAwToMember.ts'
import { fetchWp21MdBs } from './fetchPersons.ts'

const memberIdRows = db.all(sql`SELECT id FROM ${members}`) as Array<{ id: string }>
const memberIds = new Set(memberIdRows.map((r) => r.id))
const match = buildAwMatcher(memberIds)

const persons = await fetchWp21MdBs()
console.log(`Fetched ${persons.length} WP21 MdBs from DIP`)

let updated = 0
db.transaction((tx) => {
  for (const p of persons) {
    const label = `${p.vorname} ${p.nachname}`
    const memberId = match(label)
    if (!memberId) continue
    tx.update(members).set({ dipPersonId: Number(p.id) }).where(eq(members.id, memberId)).run()
    updated++
  }
})

console.log(`Set dip_person_id on ${updated} members; unmatched DIP persons: ${match.unmatched().length}`)
for (const u of match.unmatched()) console.log(`  unmatched: ${u}`)
