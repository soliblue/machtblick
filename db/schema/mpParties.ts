import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'

export const mpParties = sqliteTable(
  'mp_parties',
  {
    parliament: text('parliament').notNull(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    shortName: text('short_name').notNull(),
    color: text('color'),
    seats: integer('seats'),
    memberCount: integer('member_count'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.parliament, t.slug] }),
  }),
)
