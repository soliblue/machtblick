import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { db } from '@machtblick/db/client'
import { mpVotes, mpVotePartySummaries, mpMemberVotes, mpMembers } from '@machtblick/db/schema'
import { eq, and } from 'drizzle-orm'
import type { ParliamentDbKey } from '../lib/parliaments'
import { loadMpParties } from './mpPartyMap'
import type { MpPartySummary } from './mpVotes'

export type MpDefector = {
  party: string
  label: string
  majority: string
  count: number
  members: Array<{ id: string; name: string; choice: string; pictureUrl: string | null }>
}

export type MpVoteDetail = {
  vote: {
    id: string
    date: string
    title: string
    titleDe: string | null
    titleIsEnglish: boolean
    description: string | null
    reference: string | null
    result: 'angenommen' | 'abgelehnt'
    yes: number
    no: number
    abstain: number
    absent: number
    totalMembers: number
    sourceUrl: string
  }
  partySummaries: MpPartySummary[]
  defectors: MpDefector[]
}

const majorityOf = (s: { yes: number | null; no: number | null; abstain: number | null; absent: number | null }) => {
  const choices = [
    ['ja', s.yes ?? 0],
    ['nein', s.no ?? 0],
    ['enthalten', s.abstain ?? 0],
    ['nicht_abgegeben', s.absent ?? 0],
  ] as const
  return choices.reduce((a, b) => (b[1] > a[1] ? b : a))[0]
}

export const mpVoteDetail = createServerFn({ method: 'GET' })
  .inputValidator((input: { parliament: ParliamentDbKey; id: string }) => input)
  .handler(async ({ data }): Promise<MpVoteDetail> => {
    const { parliament, id } = data
    const v = db.select().from(mpVotes).where(and(eq(mpVotes.parliament, parliament), eq(mpVotes.id, id))).get()
    if (!v) throw notFound()
    const parties = loadMpParties(parliament)
    const summaryRows = db.select().from(mpVotePartySummaries).where(and(eq(mpVotePartySummaries.parliament, parliament), eq(mpVotePartySummaries.voteId, id))).all()
    const partySummaries: MpPartySummary[] = summaryRows.map((s) => ({
      party: s.party,
      label: parties.get(s.party)?.label ?? s.party,
      color: parties.get(s.party)?.color ?? null,
      position: s.position,
      members: s.members ?? 0,
      yes: s.yes ?? 0,
      no: s.no ?? 0,
      abstain: s.abstain ?? 0,
      absent: s.absent ?? 0,
    }))
    const majorityByParty = new Map(summaryRows.map((s) => [s.party, majorityOf(s)]))
    const ballots = db
      .select({ memberId: mpMemberVotes.memberId, choice: mpMemberVotes.choice, name: mpMembers.name, party: mpMembers.party, pictureUrl: mpMembers.pictureUrl })
      .from(mpMemberVotes)
      .innerJoin(mpMembers, and(eq(mpMembers.parliament, mpMemberVotes.parliament), eq(mpMembers.id, mpMemberVotes.memberId)))
      .where(and(eq(mpMemberVotes.parliament, parliament), eq(mpMemberVotes.voteId, id)))
      .all()
    const defectorsByParty = new Map<string, MpDefector['members']>()
    for (const b of ballots) {
      if (!b.party) continue
      const maj = majorityByParty.get(b.party)
      if (!maj || maj === 'nicht_abgegeben' || b.choice === maj || b.choice === 'nicht_abgegeben') continue
      const arr = defectorsByParty.get(b.party) ?? []
      arr.push({ id: b.memberId, name: b.name, choice: b.choice, pictureUrl: b.pictureUrl })
      defectorsByParty.set(b.party, arr)
    }
    const defectors = Array.from(defectorsByParty.entries())
      .map(([party, members]) => ({ party, label: parties.get(party)?.label ?? party, majority: majorityByParty.get(party)!, count: members.length, members }))
      .sort((a, b) => b.count - a.count)
    return {
      vote: {
        id: v.id,
        date: v.date,
        title: v.title,
        titleDe: v.titleDe,
        titleIsEnglish: !v.titleDe,
        description: v.description,
        reference: v.reference,
        result: v.result,
        yes: v.yes ?? 0,
        no: v.no ?? 0,
        abstain: v.abstain ?? 0,
        absent: v.absent ?? 0,
        totalMembers: v.totalMembers ?? (v.yes ?? 0) + (v.no ?? 0) + (v.abstain ?? 0) + (v.absent ?? 0),
        sourceUrl: v.sourceUrl,
      },
      partySummaries,
      defectors,
    }
  })
