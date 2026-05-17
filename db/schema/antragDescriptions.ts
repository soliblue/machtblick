import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'
import { antraege } from './antraege'
import { votes } from './votes'

export const antragDescriptions = sqliteTable('antrag_descriptions', {
  antragId: integer('antrag_id').primaryKey().notNull().references(() => antraege.id),
  summarySimplified: text('summary_simplified'),
  summaryDetail: text('summary_detail'),
  sourceVoteId: text('source_vote_id').references(() => votes.id),
  sourcePdfUrl: text('source_pdf_url'),
  model: text('model'),
  generatedAt: text('generated_at'),
  promptVersion: integer('prompt_version'),
})

export const antragDescriptionTranslations = sqliteTable(
  'antrag_description_translations',
  {
    antragId: integer('antrag_id').notNull().references(() => antraege.id),
    locale: text('locale').notNull(),
    summarySimplified: text('summary_simplified'),
    summaryDetail: text('summary_detail'),
    sourceHash: text('source_hash'),
    model: text('model'),
    promptVersion: text('prompt_version'),
    translatedAt: text('translated_at'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.antragId, t.locale] }),
  }),
)
