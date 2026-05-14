import { sqliteTable, integer, text, unique, index } from 'drizzle-orm/sqlite-core'
import { partyLineages } from './partyLineages'

export const partyLineageMembers = sqliteTable(
  'party_lineage_members',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    lineageId: text('lineage_id').notNull().references(() => partyLineages.id),
    partyName: text('party_name').notNull(),
    validFrom: text('valid_from').notNull(),
    validTo: text('valid_to'),
  },
  (t) => ({
    uniqLineagePartyFrom: unique().on(t.lineageId, t.partyName, t.validFrom),
    byPartyNameIdx: index('party_lineage_members_party_name_idx').on(t.partyName),
  }),
)

export type PartyLineageMember = typeof partyLineageMembers.$inferSelect
export type NewPartyLineageMember = typeof partyLineageMembers.$inferInsert
