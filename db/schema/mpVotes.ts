import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core'

export const mpVotes = sqliteTable(
  'mp_votes',
  {
    parliament: text('parliament').notNull(),
    id: text('id').notNull(),
    date: text('date').notNull(),
    title: text('title').notNull(),
    titleDe: text('title_de'),
    description: text('description'),
    reference: text('reference'),
    procedureReference: text('procedure_reference'),
    result: text('result', { enum: ['angenommen', 'abgelehnt'] }).notNull(),
    yes: integer('yes'),
    no: integer('no'),
    abstain: integer('abstain'),
    absent: integer('absent'),
    totalMembers: integer('total_members'),
    sourceUrl: text('source_url').notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.parliament, t.id] }),
    dateIdx: index('mp_votes_date_idx').on(t.parliament, t.date),
  }),
)
