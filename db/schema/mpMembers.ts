import { sqliteTable, text, index, primaryKey } from 'drizzle-orm/sqlite-core'

export const mpMembers = sqliteTable(
  'mp_members',
  {
    parliament: text('parliament').notNull(),
    id: text('id').notNull(),
    name: text('name').notNull(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    party: text('party'),
    nationalParty: text('national_party'),
    country: text('country'),
    state: text('state'),
    pictureUrl: text('picture_url'),
    pictureLicense: text('picture_license'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.parliament, t.id] }),
    partyIdx: index('mp_members_party_idx').on(t.parliament, t.party),
    countryIdx: index('mp_members_country_idx').on(t.parliament, t.country),
  }),
)
