import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import { members } from './members'
import { bundestagTerms } from './bundestagTerms'

export const memberMandates = sqliteTable(
  'member_mandates',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    memberId: text('member_id').notNull().references(() => members.id),
    termId: integer('term_id').notNull().references(() => bundestagTerms.id),
    btMdbId: text('bt_mdb_id'),
    awPoliticianId: integer('aw_politician_id'),
    awMandateId: integer('aw_mandate_id'),
    mandateType: text('mandate_type'),
    listState: text('list_state'),
    constituencyNumber: text('constituency_number'),
    constituencyName: text('constituency_name'),
    validFrom: text('valid_from'),
    validTo: text('valid_to'),
  },
  (t) => ({
    uniqMemberTerm: unique().on(t.memberId, t.termId, t.validFrom),
    termIdx: index('member_mandates_term_idx').on(t.termId),
    memberIdx: index('member_mandates_member_idx').on(t.memberId),
  }),
)

export type MemberMandate = typeof memberMandates.$inferSelect
export type NewMemberMandate = typeof memberMandates.$inferInsert
