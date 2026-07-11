import { sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core'
import { votes } from './votes'

export const votePartySummaryTranslations = sqliteTable(
  'vote_party_summary_translations',
  {
    voteId: text('vote_id').notNull().references(() => votes.id),
    party: text('party').notNull(),
    locale: text('locale', { enum: ['en'] }).notNull(),
    positionSummary: text('position_summary'),
    keyPoints: text('key_points'),
    dissentNote: text('dissent_note'),
    sourceHash: text('source_hash').notNull(),
    model: text('model').notNull(),
    modelReasoningEffort: text('model_reasoning_effort'),
    promptVersion: text('prompt_version').notNull(),
    translatedAt: text('translated_at').notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.voteId, t.party, t.locale] }),
  }),
)
