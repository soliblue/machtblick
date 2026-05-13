import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { index } from 'drizzle-orm/sqlite-core'

export const members = sqliteTable(
  'members',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    btMdbId: text('bt_mdb_id'),
    pictureUrl: text('picture_url'),
    pictureAuthor: text('picture_author'),
    pictureLicense: text('picture_license'),
    pictureSourceUrl: text('picture_source_url'),
  },
  (t) => ({
    btMdbIdIdx: index('members_bt_mdb_id_idx').on(t.btMdbId),
  }),
)
