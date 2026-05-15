import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'
import { votes } from './votes'

export const votePartySummaries = sqliteTable(
  'vote_party_summaries',
  {
    voteId: text('vote_id').notNull().references(() => votes.id),
    party: text('party').notNull(),
    position: text('position', { enum: ['yes', 'no', 'abstain', 'mixed'] }).notNull().default('mixed'),
    members: integer('members'),
    yes: integer('yes'),
    no: integer('no'),
    abstain: integer('abstain'),
    absent: integer('absent'),
    positionSummary: text('position_summary'),
    keyPoints: text('key_points'),
    dissentNote: text('dissent_note'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.voteId, t.party] }),
  }),
)
