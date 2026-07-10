import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { db } from '@machtblick/db/client'
import { mpParties, mpVotePartySummaries, mpMembers } from '@machtblick/db/schema'
import { eq, and } from 'drizzle-orm'
import type { ParliamentDbKey } from '../lib/parliaments'
import { loadMpParties } from './mpPartyMap'
import { cohesion, attendance } from './partyStats'

export type MpPartyListItem = {
  slug: string
  name: string
  label: string
  color: string | null
  seats: number
  cohesion: number
  attendance: number
}

export type MpPartyDetail = MpPartyListItem & {
  members: Array<{ id: string; name: string; nationalParty: string | null; country: string | null; pictureUrl: string | null }>
}

const asParliament = (input: unknown): ParliamentDbKey => (input === 'be' || input === 'by' ? input : 'eu')

function statsByParty(parliament: ParliamentDbKey) {
  const summaries = db.select().from(mpVotePartySummaries).where(eq(mpVotePartySummaries.parliament, parliament)).all()
  const byParty = new Map<string, { coh: number; att: number; n: number }>()
  for (const s of summaries) {
    const acc = byParty.get(s.party) ?? { coh: 0, att: 0, n: 0 }
    acc.coh += cohesion(s)
    acc.att += attendance(s)
    acc.n++
    byParty.set(s.party, acc)
  }
  return byParty
}

export const mpPartiesList = createServerFn({ method: 'GET' })
  .inputValidator(asParliament)
  .handler(async ({ data: parliament }): Promise<MpPartyListItem[]> => {
    const parties = loadMpParties(parliament)
    const stats = statsByParty(parliament)
    return Array.from(parties.values())
      .map((p) => {
        const s = stats.get(p.slug)
        return {
          slug: p.slug,
          name: p.name,
          label: p.label,
          color: p.color,
          seats: p.seats,
          cohesion: s && s.n ? s.coh / s.n : 0,
          attendance: s && s.n ? s.att / s.n : 0,
        }
      })
      .sort((a, b) => b.seats - a.seats)
  })

export const mpPartyDetail = createServerFn({ method: 'GET' })
  .inputValidator((input: { parliament: ParliamentDbKey; slug: string }) => input)
  .handler(async ({ data }): Promise<MpPartyDetail> => {
    const { parliament, slug } = data
    const parties = loadMpParties(parliament)
    const p = parties.get(slug)
    if (!p) throw notFound()
    const s = statsByParty(parliament).get(slug)
    const members = db
      .select({ id: mpMembers.id, name: mpMembers.name, lastName: mpMembers.lastName, nationalParty: mpMembers.nationalParty, country: mpMembers.country, pictureUrl: mpMembers.pictureUrl })
      .from(mpMembers)
      .where(and(eq(mpMembers.parliament, parliament), eq(mpMembers.party, slug)))
      .all()
    members.sort((a, b) => (a.lastName ?? a.name).localeCompare(b.lastName ?? b.name, 'de'))
    return {
      slug: p.slug,
      name: p.name,
      label: p.label,
      color: p.color,
      seats: p.seats,
      cohesion: s && s.n ? s.coh / s.n : 0,
      attendance: s && s.n ? s.att / s.n : 0,
      members: members.map((m) => ({ id: m.id, name: m.name, nationalParty: m.nationalParty, country: m.country, pictureUrl: m.pictureUrl })),
    }
  })
