import { createServerFn } from '@tanstack/react-start'
import { db } from '@machtblick/db/client'
import { mpVotes, mpVotePartySummaries } from '@machtblick/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import type { ParliamentDbKey } from '../lib/parliaments'
import { loadMpParties } from './mpPartyMap'

export type MpPartySummary = {
  party: string
  label: string
  color: string | null
  position: 'yes' | 'no' | 'abstain' | 'mixed'
  members: number
  yes: number
  no: number
  abstain: number
  absent: number
}

export type MpVoteListItem = {
  id: string
  date: string
  title: string
  titleDe: string | null
  titleIsEnglish: boolean
  result: 'angenommen' | 'abgelehnt'
  yes: number
  no: number
  abstain: number
  absent: number
  totalMembers: number
  partySummaries: MpPartySummary[]
}

const asParliament = (input: unknown): ParliamentDbKey => (input === 'be' || input === 'by' ? input : 'eu')

export const mpVotesList = createServerFn({ method: 'GET' })
  .inputValidator(asParliament)
  .handler(async ({ data: parliament }): Promise<MpVoteListItem[]> => {
    const rows = db.select().from(mpVotes).where(eq(mpVotes.parliament, parliament)).orderBy(desc(mpVotes.date), desc(mpVotes.id)).all()
    const summaries = db.select().from(mpVotePartySummaries).where(eq(mpVotePartySummaries.parliament, parliament)).all()
    const parties = loadMpParties(parliament)
    const byVote = new Map<string, typeof summaries>()
    for (const s of summaries) {
      const arr = byVote.get(s.voteId) ?? []
      arr.push(s)
      byVote.set(s.voteId, arr)
    }
    return rows.map((v) => ({
      id: v.id,
      date: v.date,
      title: v.title,
      titleDe: v.titleDe,
      titleIsEnglish: !v.titleDe,
      result: v.result,
      yes: v.yes ?? 0,
      no: v.no ?? 0,
      abstain: v.abstain ?? 0,
      absent: v.absent ?? 0,
      totalMembers: v.totalMembers ?? (v.yes ?? 0) + (v.no ?? 0) + (v.abstain ?? 0) + (v.absent ?? 0),
      partySummaries: (byVote.get(v.id) ?? []).map((s) => ({
        party: s.party,
        label: parties.get(s.party)?.label ?? s.party,
        color: parties.get(s.party)?.color ?? null,
        position: s.position,
        members: s.members ?? 0,
        yes: s.yes ?? 0,
        no: s.no ?? 0,
        abstain: s.abstain ?? 0,
        absent: s.absent ?? 0,
      })),
    }))
  })
