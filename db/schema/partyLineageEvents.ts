import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core'
import { partyLineages } from './partyLineages'

export const partyLineageEvents = sqliteTable(
  'party_lineage_events',
  {
    id: text('id').primaryKey(),
    date: text('date').notNull(),
    type: text('type', {
      enum: ['founded', 'renamed', 'merged_in', 'merged_out', 'split_out', 'dissolved'],
    }).notNull(),
    labelDe: text('label_de').notNull(),
    lineageId: text('lineage_id').notNull().references(() => partyLineages.id),
    relatedLineageId: text('related_lineage_id').references(() => partyLineages.id),
  },
  (t) => ({
    byLineageIdx: index('party_lineage_events_lineage_idx').on(t.lineageId),
  }),
)

export type PartyLineageEvent = typeof partyLineageEvents.$inferSelect
export type NewPartyLineageEvent = typeof partyLineageEvents.$inferInsert
