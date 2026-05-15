import { sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core'
import { speeches } from './speeches'

export const speechTranslations = sqliteTable(
  'speech_translations',
  {
    speechId: text('speech_id').notNull().references(() => speeches.id),
    locale: text('locale', { enum: ['en'] }).notNull(),
    textExcerpt: text('text_excerpt').notNull(),
    textFull: text('text_full').notNull(),
    sourceHash: text('source_hash').notNull(),
    model: text('model').notNull(),
    promptVersion: text('prompt_version').notNull(),
    translatedAt: text('translated_at').notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.speechId, t.locale] }),
  }),
)
