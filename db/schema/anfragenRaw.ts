import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const anfragenRaw = sqliteTable('anfragen_raw', {
  anfrageId: integer('anfrage_id').primaryKey(),
  vorgangJson: text('vorgang_json', { mode: 'json' }).notNull(),
  positionsJson: text('positions_json', { mode: 'json' }).notNull(),
  fetchedAt: text('fetched_at').notNull(),
})
