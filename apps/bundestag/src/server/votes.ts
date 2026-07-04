import { createServerFn } from '@tanstack/react-start'
import { db } from '@machtblick/db/client'
import { votes, votePartySummaries } from '@machtblick/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { CURRENT_TERM } from './term'
import { overlayVote, voteTranslationMap } from './translations'
import { SHOW_HAMMELSPRUNG } from '../lib/voteTypes'
import { normalizeLocale } from '../lib/locale'
import { compareVotesNewest } from '../lib/voteOrdering'
import { requireVoteCleanTitle } from '../lib/voteTitles'

export type VoteListItem = {
  id: string
  date: string
  title: string
  cleanTitle: string
  topic: string | null
  voteType: 'namentlich' | 'handzeichen' | 'hammelsprung'
  proposingParty: string | null
  result: 'angenommen' | 'abgelehnt'
  yes: number
  no: number
  abstain: number
  absent: number | null
  totalMembers: number
  summarySimplified: string | null
  partySummaries: Array<{ party: string; position: 'yes' | 'no' | 'abstain' | 'mixed'; members: number; yes: number; no: number; abstain: number; absent: number }>
}

const clipSummary = (s: string | null) => {
  const text = (s ?? '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim()
  const clipped = text.length > 700 ? `${text.slice(0, 700).replace(/\s+\S*$/, '')}…` : text
  const balanced = clipped.split('**').length % 2 === 0 ? `${clipped}**` : clipped
  return balanced || null
}

export const listVotes = createServerFn({ method: 'GET' })
  .inputValidator(normalizeLocale)
  .handler(async ({ data: locale }): Promise<VoteListItem[]> => {
  const allRows = db.select().from(votes).where(and(eq(votes.termId, CURRENT_TERM), eq(votes.procedural, false))).orderBy(desc(votes.date), desc(votes.bundestagId)).all()
  const rows = (SHOW_HAMMELSPRUNG ? allRows : allRows.filter((r) => r.voteType !== 'hammelsprung')).sort(compareVotesNewest)
  const translations = voteTranslationMap(rows.map((r) => r.id), locale)
  const allSummaries = db.select().from(votePartySummaries).all()
  const byVote = new Map<string, typeof allSummaries>()
  for (const s of allSummaries) {
    const arr = byVote.get(s.voteId) ?? []
    arr.push(s)
    byVote.set(s.voteId, arr)
  }
  const seatsByParty = new Map<string, number>()
  for (const r of rows) {
    if (r.voteType !== 'namentlich') continue
    for (const s of byVote.get(r.id) ?? []) {
      if (s.members && !seatsByParty.has(s.party)) seatsByParty.set(s.party, s.members)
    }
    if (seatsByParty.size >= 6) break
  }
  const chamber = rows.find((r) => r.voteType === 'namentlich')?.totalMembers ?? 0
  return rows.map((v) => {
    const localized = requireVoteCleanTitle(overlayVote(v, translations))
    const summaries = byVote.get(v.id) ?? []
    if (v.voteType === 'namentlich' && v.yes != null) {
      return {
        id: v.id, date: v.date, title: localized.title, cleanTitle: localized.cleanTitle, topic: localized.topic, voteType: v.voteType,
        proposingParty: v.initiator, result: v.result,
        yes: v.yes, no: v.no ?? 0, abstain: v.abstain ?? 0, absent: v.absent ?? 0, totalMembers: v.totalMembers ?? 0,
        summarySimplified: clipSummary(localized.summarySimplified),
        partySummaries: summaries.map((s) => ({
          party: s.party, position: s.position, members: s.members ?? 0,
          yes: s.yes ?? 0, no: s.no ?? 0, abstain: s.abstain ?? 0, absent: s.absent ?? 0,
        })),
      }
    }
    let yes = 0, no = 0, abstain = 0
    const enriched = summaries.map((s) => {
      const seats = seatsByParty.get(s.party) ?? 0
      const bucket = s.position === 'yes' ? 'yes' : s.position === 'no' ? 'no' : s.position === 'abstain' ? 'abstain' : null
      if (bucket === 'yes') yes += seats
      if (bucket === 'no') no += seats
      if (bucket === 'abstain') abstain += seats
      return {
        party: s.party, position: s.position, members: seats,
        yes: bucket === 'yes' ? seats : 0,
        no: bucket === 'no' ? seats : 0,
        abstain: bucket === 'abstain' ? seats : 0,
        absent: 0,
      }
    })
    return {
      id: v.id, date: v.date, title: localized.title, cleanTitle: localized.cleanTitle, topic: localized.topic, voteType: v.voteType,
      proposingParty: v.initiator, result: v.result,
      yes, no, abstain, absent: null, totalMembers: Math.max(chamber, yes + no + abstain),
      summarySimplified: clipSummary(localized.summarySimplified),
      partySummaries: enriched,
    }
  })
})
