import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { votes } from './votes'

export const voteDocuments = sqliteTable('vote_documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  voteId: text('vote_id').notNull().references(() => votes.id),
  label: text('label').notNull(),
  title: text('title').notNull(),
  url: text('url').notNull(),
})
