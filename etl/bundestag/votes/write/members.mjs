import { sql } from 'drizzle-orm'
import { members } from '/Users/soli/machtblick/db/schema/index.ts'
import { splitName } from '../transform/memberId.mjs'

export function upsertMembers(tx, rows) {
  for (const row of rows) {
    const { last, first } = splitName(row.name)
    tx.insert(members).values({
      id: row.id,
      name: row.name,
      firstName: first,
      lastName: last,
    }).onConflictDoNothing().run()
  }
}
