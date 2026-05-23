import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const partyAliases = sqliteTable(
  'party_aliases',
  {
    alias: text('alias').primaryKey(),
    canonicalParty: text('canonical_party').notNull(),
    source: text('source').notNull(),
    reviewStatus: text('review_status').notNull().default('unreviewed'),
  },
  (t) => ({
    canonicalIdx: index('party_aliases_canonical_idx').on(t.canonicalParty),
  }),
)

export type PartyAlias = typeof partyAliases.$inferSelect
export type NewPartyAlias = typeof partyAliases.$inferInsert
