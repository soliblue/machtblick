import { sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core'
import { votes } from './votes'
import { members } from './members'

export const voteMembers = sqliteTable(
  'vote_members',
  {
    voteId: text('vote_id').notNull().references(() => votes.id),
    memberId: text('member_id').notNull().references(() => members.id),
    party: text('party').notNull(),
    state: text('state').notNull(),
    choice: text('choice', {
      enum: ['ja', 'nein', 'enthalten', 'nicht_abgegeben'],
    }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.voteId, t.memberId] }),
  }),
)
