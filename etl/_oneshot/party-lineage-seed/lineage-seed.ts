import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { db } from '@machtblick/db/client'
import { partyLineages, partyLineageMembers, partyLineageEvents } from '@machtblick/db/schema'
import { sql } from 'drizzle-orm'

type Lineage = {
  id: string
  displayName: string
  currentPartyId: string | null
  members: Array<{ partyName: string; validFrom: string; validTo: string | null }>
}
type Event = {
  id: string
  date: string
  type: 'founded' | 'renamed' | 'merged_in' | 'merged_out' | 'split_out' | 'dissolved'
  labelDe: string
  lineageId: string
  relatedLineageId: string | null
}
type Seed = { lineages: Lineage[]; events: Event[] }

const seedPath = fileURLToPath(new URL('./lineage.json', import.meta.url))
const seed = JSON.parse(readFileSync(seedPath, 'utf-8')) as Seed

db.transaction((tx) => {
  for (const l of seed.lineages) {
    tx.insert(partyLineages).values({
      id: l.id,
      displayName: l.displayName,
      currentPartyId: l.currentPartyId,
    }).onConflictDoUpdate({
      target: partyLineages.id,
      set: { displayName: l.displayName, currentPartyId: l.currentPartyId },
    }).run()
  }
  tx.run(sql`DELETE FROM party_lineage_members`)
  for (const l of seed.lineages) {
    for (const m of l.members) {
      tx.insert(partyLineageMembers).values({
        lineageId: l.id,
        partyName: m.partyName,
        validFrom: m.validFrom,
        validTo: m.validTo,
      }).run()
    }
  }
  tx.run(sql`DELETE FROM party_lineage_events`)
  for (const e of seed.events) {
    tx.insert(partyLineageEvents).values({
      id: e.id,
      date: e.date,
      type: e.type,
      labelDe: e.labelDe,
      lineageId: e.lineageId,
      relatedLineageId: e.relatedLineageId,
    }).run()
  }
})

console.log(`seeded lineages: ${seed.lineages.length}`)
console.log(`seeded lineage members: ${seed.lineages.reduce((acc, l) => acc + l.members.length, 0)}`)
console.log(`seeded lineage events: ${seed.events.length}`)
