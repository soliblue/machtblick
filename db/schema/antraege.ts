import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core'
import { members } from './members'

export const antraege = sqliteTable(
  'antraege',
  {
    id: integer('id').primaryKey(),
    type: text('type', { enum: ['antrag', 'gesetzentwurf'] }).notNull(),
    title: text('title').notNull(),
    cleanTitle: text('clean_title'),
    abstract: text('abstract'),
    abstractPlain: text('abstract_plain'),
    beratungsstand: text('beratungsstand'),
    wahlperiode: integer('wahlperiode').notNull(),
    initiativeFraktion: text('initiative_fraktion'),
    introducedDate: text('introduced_date'),
    drucksache: text('drucksache'),
    drucksachePdfUrl: text('drucksache_pdf_url'),
    sachgebiet: text('sachgebiet', { mode: 'json' }).$type<string[]>(),
    deskriptor: text('deskriptor', { mode: 'json' }).$type<{ name: string; typ: string }[]>(),
    updatedAt: text('updated_at'),
  },
  (t) => ({
    typeIdx: index('antraege_type_idx').on(t.type),
    dateIdx: index('antraege_introduced_date_idx').on(t.introducedDate),
    drucksacheIdx: index('antraege_drucksache_idx').on(t.drucksache),
  }),
)

export const antragSignatories = sqliteTable(
  'antrag_signatories',
  {
    antragId: integer('antrag_id').notNull().references(() => antraege.id),
    memberId: text('member_id').notNull().references(() => members.id),
    dipPersonId: integer('dip_person_id').notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.antragId, t.memberId] }),
    memberIdx: index('antrag_signatories_member_idx').on(t.memberId),
  }),
)
