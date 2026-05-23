import { index, sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { speeches } from './speeches'
import { votes } from './votes'

export const speechVoteLinks = sqliteTable(
  'speech_vote_links',
  {
    speechId: text('speech_id').primaryKey().references(() => speeches.id),
    voteId: text('vote_id').notNull().references(() => votes.id),
    source: text('source').notNull(),
    confidence: integer('confidence').notNull(),
    reviewStatus: text('review_status').notNull().default('unreviewed'),
  },
  (t) => ({
    voteIdx: index('speech_vote_links_vote_idx').on(t.voteId),
  }),
)

export type SpeechVoteLink = typeof speechVoteLinks.$inferSelect
export type NewSpeechVoteLink = typeof speechVoteLinks.$inferInsert
