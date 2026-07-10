import { db } from '@machtblick/db/client'
import { mpParties } from '@machtblick/db/schema'
import { eq } from 'drizzle-orm'
import type { ParliamentDbKey } from '../lib/parliaments'

export type MpPartyInfo = { slug: string; name: string; label: string; color: string | null; seats: number; memberCount: number }

export function loadMpParties(parliament: ParliamentDbKey): Map<string, MpPartyInfo> {
  const rows = db.select().from(mpParties).where(eq(mpParties.parliament, parliament)).all()
  return new Map(
    rows.map((r) => [r.slug, { slug: r.slug, name: r.name, label: r.shortName, color: r.color, seats: r.seats ?? 0, memberCount: r.memberCount ?? r.seats ?? 0 }]),
  )
}

export const mpPartyLabel = (parties: Map<string, MpPartyInfo>, slug: string) => parties.get(slug)?.label ?? slug
