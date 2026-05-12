import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
})
