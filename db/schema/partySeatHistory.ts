import { sqliteTable, integer, text, real, unique, index } from 'drizzle-orm/sqlite-core'
import { bundestagTerms } from './bundestagTerms'
import { partyLineages } from './partyLineages'

export const partySeatHistory = sqliteTable(
  'party_seat_history',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    termId: integer('term_id').notNull().references(() => bundestagTerms.id),
    partyName: text('party_name').notNull(),
    seats: integer('seats').notNull(),
    pctOfTotal: real('pct_of_total').notNull(),
    lineageId: text('lineage_id').references(() => partyLineages.id),
  },
  (t) => ({
    uniqTermParty: unique().on(t.termId, t.partyName),
    byLineageIdx: index('party_seat_history_lineage_idx').on(t.lineageId),
  }),
)

export type PartySeatHistoryRow = typeof partySeatHistory.$inferSelect
export type NewPartySeatHistoryRow = typeof partySeatHistory.$inferInsert
