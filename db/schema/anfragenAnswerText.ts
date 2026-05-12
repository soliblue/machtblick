import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { anfragen } from './anfragen'

export const anfragenAnswerText = sqliteTable('anfragen_answer_text', {
  anfrageId: integer('anfrage_id').primaryKey().references(() => anfragen.id),
  text: text('text').notNull(),
  extractedAt: text('extracted_at').notNull(),
  source: text('source', { enum: ['pdftotext', 'pdfjs', 'claude-haiku', 'claude-sonnet'] }).notNull(),
})
