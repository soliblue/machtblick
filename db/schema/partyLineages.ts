import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const partyLineages = sqliteTable('party_lineages', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  currentPartyId: text('current_party_id'),
})

export type PartyLineage = typeof partyLineages.$inferSelect
export type NewPartyLineage = typeof partyLineages.$inferInsert
