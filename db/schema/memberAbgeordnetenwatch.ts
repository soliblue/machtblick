import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { members } from './members'

export const memberAbgeordnetenwatch = sqliteTable('member_abgeordnetenwatch', {
  memberId: text('member_id').primaryKey().references(() => members.id),
  awPoliticianId: integer('aw_politician_id').notNull(),
  rawJson: text('raw_json').notNull(),
  pictureUrl: text('picture_url'),
  fetchedAt: text('fetched_at').notNull(),
})
