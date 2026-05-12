import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const partyDonations = sqliteTable('party_donations', {
  id: text('id').primaryKey(),
  party: text('party').notNull(),
  donor: text('donor').notNull(),
  donorAddress: text('donor_address'),
  amountEur: integer('amount_eur').notNull(),
  dateReceived: text('date_received').notNull(),
  dateNotified: text('date_notified').notNull(),
  sourceUrl: text('source_url').notNull(),
})
