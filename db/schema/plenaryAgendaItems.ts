import { index, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const plenaryAgendaItems = sqliteTable(
  'plenary_agenda_items',
  {
    sessionId: text('session_id').notNull(),
    date: text('date').notNull(),
    agendaItem: text('agenda_item').notNull(),
    sourceTitle: text('source_title').notNull(),
    title: text('title').notNull(),
    sourceUrl: text('source_url').notNull(),
    reviewStatus: text('review_status').notNull().default('unreviewed'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.sessionId, t.agendaItem] }),
    dateAgendaIdx: index('plenary_agenda_items_date_agenda_idx').on(t.date, t.agendaItem),
  }),
)

export type PlenaryAgendaItem = typeof plenaryAgendaItems.$inferSelect
export type NewPlenaryAgendaItem = typeof plenaryAgendaItems.$inferInsert
