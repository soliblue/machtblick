import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core'
import { members } from './members'

export const anfragen = sqliteTable(
  'anfragen',
  {
    id: integer('id').primaryKey(),
    type: text('type', { enum: ['kleine', 'grosse', 'schriftlich'] }).notNull(),
    title: text('title').notNull(),
    abstract: text('abstract'),
    beratungsstand: text('beratungsstand'),
    wahlperiode: integer('wahlperiode').notNull(),
    initiativeFraktion: text('initiative_fraktion'),
    questionDate: text('question_date'),
    answerDate: text('answer_date'),
    questionDrucksache: text('question_drucksache'),
    answerDrucksache: text('answer_drucksache'),
    questionPdfUrl: text('question_pdf_url'),
    answerPdfUrl: text('answer_pdf_url'),
    answerRessort: text('answer_ressort'),
    sachgebiet: text('sachgebiet', { mode: 'json' }).$type<string[]>(),
    deskriptor: text('deskriptor', { mode: 'json' }).$type<{ name: string; typ: string }[]>(),
    updatedAt: text('updated_at'),
  },
  (t) => ({
    typeIdx: index('anfragen_type_idx').on(t.type),
    dateIdx: index('anfragen_question_date_idx').on(t.questionDate),
  }),
)

export const anfrageSignatories = sqliteTable(
  'anfrage_signatories',
  {
    anfrageId: integer('anfrage_id').notNull().references(() => anfragen.id),
    memberId: text('member_id').notNull().references(() => members.id),
    dipPersonId: integer('dip_person_id').notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.anfrageId, t.memberId] }),
    memberIdx: index('anfrage_signatories_member_idx').on(t.memberId),
  }),
)
