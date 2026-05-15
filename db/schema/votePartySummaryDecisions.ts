import { sqliteTable, text, primaryKey, foreignKey } from 'drizzle-orm/sqlite-core'
import { votePartySummaries } from './votePartySummaries'

export const votePartySummaryDecisions = sqliteTable(
  'vote_party_summary_decisions',
  {
    voteId: text('vote_id').notNull(),
    party: text('party').notNull(),
    sourceSpeechIds: text('source_speech_ids').notNull(),
    model: text('model').notNull(),
    promptVersion: text('prompt_version').notNull(),
    generatedAt: text('generated_at').notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.voteId, t.party] }),
    summaryRef: foreignKey({
      columns: [t.voteId, t.party],
      foreignColumns: [votePartySummaries.voteId, votePartySummaries.party],
    }),
  }),
)
