import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { votes } from './votes'

export const voteDescriptionDecisions = sqliteTable('vote_description_decisions', {
  voteId: text('vote_id').primaryKey().references(() => votes.id),
  drucksacheId: text('drucksache_id').notNull(),
  sourcePdfUrl: text('source_pdf_url').notNull(),
  model: text('model').notNull(),
  generatedAt: text('generated_at').notNull(),
  promptVersion: integer('prompt_version').notNull(),
})
