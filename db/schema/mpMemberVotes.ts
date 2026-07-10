import { sqliteTable, text, index, primaryKey } from 'drizzle-orm/sqlite-core'

export const mpMemberVotes = sqliteTable(
  'mp_member_votes',
  {
    parliament: text('parliament').notNull(),
    voteId: text('vote_id').notNull(),
    memberId: text('member_id').notNull(),
    choice: text('choice', {
      enum: ['ja', 'nein', 'enthalten', 'nicht_abgegeben'],
    }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.parliament, t.voteId, t.memberId] }),
    memberIdx: index('mp_member_votes_member_idx').on(t.parliament, t.memberId),
  }),
)
