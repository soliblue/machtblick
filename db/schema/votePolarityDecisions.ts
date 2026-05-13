import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { votes } from './votes'

export const votePolarityDecisions = sqliteTable('vote_polarity_decisions', {
  voteId: text('vote_id').primaryKey().references(() => votes.id),
  inverted: integer('inverted', { mode: 'boolean' }).notNull(),
  source: text('source', { enum: ['rule', 'llm'] }).notNull(),
  confidence: text('confidence', { enum: ['high', 'medium', 'low'] }),
  reason: text('reason'),
  rewrittenTitle: text('rewritten_title'),
  originalTitle: text('original_title'),
  decidedAt: text('decided_at').notNull(),
})
