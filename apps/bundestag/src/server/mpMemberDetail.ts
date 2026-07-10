import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { db } from '@machtblick/db/client'
import { mpMembers, mpMemberVotes, mpVotes } from '@machtblick/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import type { ParliamentDbKey } from '../lib/parliaments'
import { loadMpParties } from './mpPartyMap'

export type MpMemberBallot = {
  voteId: string
  title: string
  titleDe: string | null
  date: string
  result: 'angenommen' | 'abgelehnt'
  choice: 'ja' | 'nein' | 'enthalten' | 'nicht_abgegeben'
}

export type MpMemberDetail = {
  member: {
    id: string
    name: string
    party: string
    label: string
    nationalParty: string | null
    country: string | null
    state: string | null
    pictureUrl: string | null
  }
  attendance: number
  votesAppeared: number
  ballots: MpMemberBallot[]
}

export const mpMemberDetail = createServerFn({ method: 'GET' })
  .inputValidator((input: { parliament: ParliamentDbKey; id: string }) => input)
  .handler(async ({ data }): Promise<MpMemberDetail> => {
    const { parliament, id } = data
    const m = db.select().from(mpMembers).where(and(eq(mpMembers.parliament, parliament), eq(mpMembers.id, id))).get()
    if (!m) throw notFound()
    const parties = loadMpParties(parliament)
    const rows = db
      .select({ voteId: mpMemberVotes.voteId, choice: mpMemberVotes.choice, title: mpVotes.title, titleDe: mpVotes.titleDe, date: mpVotes.date, result: mpVotes.result })
      .from(mpMemberVotes)
      .innerJoin(mpVotes, and(eq(mpVotes.parliament, mpMemberVotes.parliament), eq(mpVotes.id, mpMemberVotes.voteId)))
      .where(and(eq(mpMemberVotes.parliament, parliament), eq(mpMemberVotes.memberId, id)))
      .orderBy(desc(mpVotes.date), desc(mpVotes.id))
      .all()
    const absent = rows.filter((r) => r.choice === 'nicht_abgegeben').length
    return {
      member: {
        id: m.id,
        name: m.name,
        party: m.party ?? '',
        label: m.party ? parties.get(m.party)?.label ?? m.party : '',
        nationalParty: m.nationalParty,
        country: m.country,
        state: m.state,
        pictureUrl: m.pictureUrl,
      },
      attendance: rows.length ? 1 - absent / rows.length : 0,
      votesAppeared: rows.length,
      ballots: rows,
    }
  })
