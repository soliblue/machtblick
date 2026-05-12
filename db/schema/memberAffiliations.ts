import { sqliteTable, text, integer, unique, index } from 'drizzle-orm/sqlite-core'
import { members } from './members'

export const memberAffiliations = sqliteTable(
  'member_affiliations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    memberId: text('member_id').notNull().references(() => members.id),
    party: text('party').notNull(),
    validFrom: text('valid_from').notNull(),
    validTo: text('valid_to'),
  },
  (t) => ({
    uniqMemberFrom: unique().on(t.memberId, t.validFrom),
    currentIdx: index('member_affiliations_current_idx').on(t.memberId, t.validTo),
  }),
)

export type MemberAffiliation = typeof memberAffiliations.$inferSelect
export type NewMemberAffiliation = typeof memberAffiliations.$inferInsert
