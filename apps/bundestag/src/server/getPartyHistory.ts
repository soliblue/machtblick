import { createServerFn } from '@tanstack/react-start'
import { db } from '@machtblick/db/client'
import { bundestagTerms, partyLineages, partyLineageMembers, partySeatHistory, partyLineageEvents } from '@machtblick/db/schema'
import { eq } from 'drizzle-orm'
import { SLUG_TO_PARTY } from '@/lib/parties'

const PRE_2005_SEATS_AVAILABLE = false
const FIRST_COVERED_YEAR_ISO = '2005-01-01'

export type PartyHistoryPoint = {
  termNumber: number
  year: number
  seats: number
  totalSeats: number
  pctOfTotal: number
  partyNameAtTime: string
}

export type PartyHistoryEvent = {
  date: string
  type: 'founded' | 'renamed' | 'merged_in' | 'merged_out' | 'split_out' | 'dissolved'
  labelDe: string
  side: 'inbound' | 'outbound' | 'self'
}

export type PartyHistory = {
  points: PartyHistoryPoint[]
  events: PartyHistoryEvent[]
}

export const getPartyHistory = createServerFn({ method: 'GET' })
  .inputValidator((partyId: string) => partyId)
  .handler(async ({ data: partyId }): Promise<PartyHistory> => {
    const canonical = SLUG_TO_PARTY[partyId] ?? partyId
    const startLineage =
      db.select({ id: partyLineages.id }).from(partyLineages).where(eq(partyLineages.currentPartyId, canonical)).get()
      ?? db.select({ id: partyLineageMembers.lineageId }).from(partyLineageMembers).where(eq(partyLineageMembers.partyName, canonical)).get()
    if (!startLineage) return { points: [], events: [] }

    const allEvents = db.select().from(partyLineageEvents).all()
    const allSeats = db.select().from(partySeatHistory).all()
    const trunk = new Set<string>([startLineage.id])
    const queue = [startLineage.id]
    while (queue.length) {
      const current = queue.shift()!
      for (const e of allEvents.filter((ev) => ev.lineageId === current && ev.type === 'renamed' && ev.relatedLineageId)) {
        if (!trunk.has(e.relatedLineageId!)) {
          trunk.add(e.relatedLineageId!)
          queue.push(e.relatedLineageId!)
        }
      }
      const mergers = allEvents.filter((ev) => ev.lineageId === current && ev.type === 'merged_in' && ev.relatedLineageId)
      if (mergers.length === 0) continue
      const seatsByLineage = new Map<string, number>()
      for (const m of mergers) {
        const beforeTerm = db
          .select({ seats: partySeatHistory.seats, termId: partySeatHistory.termId, startDate: bundestagTerms.startDate })
          .from(partySeatHistory)
          .innerJoin(bundestagTerms, eq(bundestagTerms.id, partySeatHistory.termId))
          .where(eq(partySeatHistory.lineageId, m.relatedLineageId!))
          .all()
          .filter((r) => r.startDate < m.date)
          .sort((a, b) => b.termId - a.termId)[0]
        seatsByLineage.set(m.relatedLineageId!, beforeTerm?.seats ?? 0)
      }
      const winner = [...seatsByLineage.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
      if (winner && !trunk.has(winner)) {
        trunk.add(winner)
        queue.push(winner)
      }
    }

    const trunkIds = [...trunk]
    const terms = db.select().from(bundestagTerms).all()
    const termById = new Map(terms.map((t) => [t.id, t]))
    const seatRows = allSeats.filter((r) => r.lineageId && trunkIds.includes(r.lineageId))
    const points: PartyHistoryPoint[] = seatRows
      .map((r) => {
        const term = termById.get(r.termId)!
        return {
          termNumber: term.number,
          year: Number(term.startDate.slice(0, 4)),
          seats: r.seats,
          totalSeats: term.totalSeats,
          pctOfTotal: r.pctOfTotal,
          partyNameAtTime: r.partyName,
        }
      })
      .sort((a, b) => a.termNumber - b.termNumber)

    const events: PartyHistoryEvent[] = allEvents
      .filter((e) => trunkIds.includes(e.lineageId))
      .filter((e) => PRE_2005_SEATS_AVAILABLE || e.date >= FIRST_COVERED_YEAR_ISO)
      .map((e): PartyHistoryEvent => ({
        date: e.date,
        type: e.type,
        labelDe: e.labelDe,
        side:
          e.type === 'merged_in' ? 'inbound'
          : e.type === 'merged_out' || e.type === 'split_out' ? 'outbound'
          : 'self',
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return { points, events }
  })
