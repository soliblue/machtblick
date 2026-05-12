import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const speeches = sqliteTable('speeches', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  agendaItem: text('agenda_item'),
  voteId: text('vote_id'),
  speakerMemberId: text('speaker_member_id'),
  speakerName: text('speaker_name').notNull(),
  speakerRole: text('speaker_role'),
  party: text('party'),
  date: text('date').notNull(),
  position: integer('position').notNull(),
  textExcerpt: text('text_excerpt').notNull(),
  textFull: text('text_full').notNull(),
  wordCount: integer('word_count').notNull(),
  sourceUrl: text('source_url').notNull(),
}, (t) => ({
  bySession: index('speeches_session_idx').on(t.sessionId),
  byVote: index('speeches_vote_idx').on(t.voteId),
  byMember: index('speeches_member_idx').on(t.speakerMemberId),
  byDate: index('speeches_date_idx').on(t.date),
}))

export type Speech = typeof speeches.$inferSelect
export type NewSpeech = typeof speeches.$inferInsert
