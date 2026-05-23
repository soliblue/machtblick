import { index, primaryKey, sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { votes } from './votes'
import { voteDocuments } from './voteDocuments'

export const voteDocumentRoles = sqliteTable(
  'vote_document_roles',
  {
    voteId: text('vote_id').notNull().references(() => votes.id),
    documentId: integer('document_id').notNull().references(() => voteDocuments.id),
    role: text('role').notNull(),
    source: text('source').notNull(),
    reviewStatus: text('review_status').notNull().default('unreviewed'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.voteId, t.documentId, t.role] }),
    documentIdx: index('vote_document_roles_document_idx').on(t.documentId),
    voteRoleIdx: index('vote_document_roles_vote_role_idx').on(t.voteId, t.role),
  }),
)

export type VoteDocumentRole = typeof voteDocumentRoles.$inferSelect
export type NewVoteDocumentRole = typeof voteDocumentRoles.$inferInsert
