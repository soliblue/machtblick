import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

export const bundestagTerms = sqliteTable('bundestag_terms', {
  id: integer('id').primaryKey(),
  number: integer('number').notNull().unique(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  totalSeats: integer('total_seats').notNull(),
})

export type BundestagTerm = typeof bundestagTerms.$inferSelect
export type NewBundestagTerm = typeof bundestagTerms.$inferInsert
