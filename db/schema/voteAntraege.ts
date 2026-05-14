import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core'
import { votes } from './votes'
import { antraege } from './antraege'

export const voteAntraege = sqliteTable(
  'vote_antraege',
  {
    voteId: text('vote_id').notNull().references(() => votes.id),
    antragId: integer('antrag_id').notNull().references(() => antraege.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.voteId, t.antragId] }),
    antragIdx: index('vote_antraege_antrag_idx').on(t.antragId),
  }),
)
