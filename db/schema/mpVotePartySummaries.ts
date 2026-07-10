import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'

export const mpVotePartySummaries = sqliteTable(
  'mp_vote_party_summaries',
  {
    parliament: text('parliament').notNull(),
    voteId: text('vote_id').notNull(),
    party: text('party').notNull(),
    position: text('position', { enum: ['yes', 'no', 'abstain', 'mixed'] }).notNull().default('mixed'),
    yes: integer('yes'),
    no: integer('no'),
    abstain: integer('abstain'),
    absent: integer('absent'),
    members: integer('members'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.parliament, t.voteId, t.party] }),
  }),
)
