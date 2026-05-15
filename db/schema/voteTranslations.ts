import { sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core'
import { votes } from './votes'

export const voteTranslations = sqliteTable(
  'vote_translations',
  {
    voteId: text('vote_id').notNull().references(() => votes.id),
    locale: text('locale', { enum: ['en'] }).notNull(),
    title: text('title').notNull(),
    cleanTitle: text('clean_title'),
    topic: text('topic'),
    subject: text('subject'),
    summary: text('summary'),
    summarySimplified: text('summary_simplified'),
    summaryDetail: text('summary_detail'),
    sourceHash: text('source_hash').notNull(),
    model: text('model').notNull(),
    promptVersion: text('prompt_version').notNull(),
    translatedAt: text('translated_at').notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.voteId, t.locale] }),
  }),
)
