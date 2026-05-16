import { sqliteTable, text, integer, unique, index } from 'drizzle-orm/sqlite-core'
import { members } from './members'
import { bundestagTerms } from './bundestagTerms'

export const memberAffiliations = sqliteTable(
  'member_affiliations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    memberId: text('member_id').notNull().references(() => members.id),
    termId: integer('term_id').notNull().default(21).references(() => bundestagTerms.id),
    party: text('party').notNull(),
    validFrom: text('valid_from').notNull(),
    validTo: text('valid_to'),
  },
  (t) => ({
    uniqMemberFrom: unique().on(t.memberId, t.termId, t.validFrom),
    currentIdx: index('member_affiliations_current_idx').on(t.memberId, t.validTo),
    termIdx: index('member_affiliations_term_idx').on(t.termId),
  }),
)

export type MemberAffiliation = typeof memberAffiliations.$inferSelect
export type NewMemberAffiliation = typeof memberAffiliations.$inferInsert
