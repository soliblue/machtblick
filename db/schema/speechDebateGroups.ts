import { index, primaryKey, sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core'
import { speeches } from './speeches'

export const speechDebateGroups = sqliteTable(
  'speech_debate_groups',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id').notNull(),
    date: text('date').notNull(),
    agendaItem: text('agenda_item').notNull(),
    title: text('title').notNull(),
    source: text('source').notNull(),
    reviewStatus: text('review_status').notNull().default('unreviewed'),
  },
  (t) => ({
    sessionAgendaIdx: index('speech_debate_groups_session_agenda_idx').on(t.sessionId, t.agendaItem),
    dateAgendaIdx: index('speech_debate_groups_date_agenda_idx').on(t.date, t.agendaItem),
  }),
)

export const speechDebateGroupSpeeches = sqliteTable(
  'speech_debate_group_speeches',
  {
    groupId: text('group_id').notNull().references(() => speechDebateGroups.id),
    speechId: text('speech_id').notNull().references(() => speeches.id),
    position: integer('position').notNull(),
    contributionType: text('contribution_type', { enum: ['speech', 'short'] }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.groupId, t.speechId] }),
    speechUnique: unique().on(t.speechId),
    speechIdx: index('speech_debate_group_speeches_speech_idx').on(t.speechId),
  }),
)

export type SpeechDebateGroup = typeof speechDebateGroups.$inferSelect
export type NewSpeechDebateGroup = typeof speechDebateGroups.$inferInsert
export type SpeechDebateGroupSpeech = typeof speechDebateGroupSpeeches.$inferSelect
export type NewSpeechDebateGroupSpeech = typeof speechDebateGroupSpeeches.$inferInsert
