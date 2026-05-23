import { index, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { votes } from './votes'
import { speechDebateGroups } from './speechDebateGroups'

export const voteDebateGroups = sqliteTable(
  'vote_debate_groups',
  {
    voteId: text('vote_id').notNull().references(() => votes.id),
    groupId: text('group_id').notNull().references(() => speechDebateGroups.id),
    source: text('source').notNull(),
    reviewStatus: text('review_status').notNull().default('unreviewed'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.voteId, t.groupId] }),
    groupIdx: index('vote_debate_groups_group_idx').on(t.groupId),
  }),
)

export type VoteDebateGroup = typeof voteDebateGroups.$inferSelect
export type NewVoteDebateGroup = typeof voteDebateGroups.$inferInsert
