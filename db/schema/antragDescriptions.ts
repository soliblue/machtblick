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
  modelReasoningEffort: text('model_reasoning_effort'),
  generatedAt: text('generated_at'),
  promptVersion: integer('prompt_version'),
})

export const antragDescriptionTranslations = sqliteTable(
  'antrag_description_translations',
  {
    antragId: integer('antrag_id').notNull().references(() => antraege.id),
    locale: text('locale').notNull(),
    title: text('title'),
    cleanTitle: text('clean_title'),
    titleSourceHash: text('title_source_hash'),
    titleModel: text('title_model'),
    titleModelReasoningEffort: text('title_model_reasoning_effort'),
    titlePromptVersion: text('title_prompt_version'),
    summarySimplified: text('summary_simplified'),
    summaryDetail: text('summary_detail'),
    sourceHash: text('source_hash'),
    model: text('model'),
    modelReasoningEffort: text('model_reasoning_effort'),
    promptVersion: text('prompt_version'),
    translatedAt: text('translated_at'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.antragId, t.locale] }),
  }),
)
