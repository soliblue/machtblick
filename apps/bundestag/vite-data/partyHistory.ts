import type Database from 'better-sqlite3'
import type { PartyHistory, PartyHistoryEvent, PartyHistoryPoint } from '../src/server/getPartyHistory'

const PRE_2005_SEATS_AVAILABLE = false
const FIRST_COVERED_YEAR_ISO = '2005-01-01'

type TermRow = { id: number; number: number; start_date: string; total_seats: number }
type SeatRow = { term_id: number; party_name: string; seats: number; pct_of_total: number; lineage_id: string | null }
type EventRow = { date: string; type: PartyHistoryEvent['type']; label_de: string; lineage_id: string; related_lineage_id: string | null }

export function partyHistory(db: Database.Database, canonical: string): PartyHistory {
  const startLineage =
    (db.prepare('SELECT id FROM party_lineages WHERE current_party_id = ?').get(canonical) as { id: string } | undefined)
    ?? (db.prepare('SELECT lineage_id AS id FROM party_lineage_members WHERE party_name = ?').get(canonical) as { id: string } | undefined)
  if (!startLineage) return { points: [], events: [] }

  const allEvents = db.prepare('SELECT date, type, label_de, lineage_id, related_lineage_id FROM party_lineage_events').all() as EventRow[]
  const allSeats = db.prepare('SELECT term_id, party_name, seats, pct_of_total, lineage_id FROM party_seat_history').all() as SeatRow[]
  const termById = new Map(
    (db.prepare('SELECT id, number, start_date, total_seats FROM bundestag_terms').all() as TermRow[]).map((t) => [t.id, t]),
  )

  const trunk = new Set<string>([startLineage.id])
  const queue = [startLineage.id]
  while (queue.length) {
    const current = queue.shift()!
    for (const e of allEvents.filter((ev) => ev.lineage_id === current && ev.type === 'renamed' && ev.related_lineage_id)) {
      if (!trunk.has(e.related_lineage_id!)) {
        trunk.add(e.related_lineage_id!)
        queue.push(e.related_lineage_id!)
      }
    }
    const mergers = allEvents.filter((ev) => ev.lineage_id === current && ev.type === 'merged_in' && ev.related_lineage_id)
    if (mergers.length === 0) continue
    const seatsByLineage = new Map<string, number>()
    for (const m of mergers) {
      const before = allSeats
        .filter((r) => r.lineage_id === m.related_lineage_id)
        .map((r) => ({ seats: r.seats, term: termById.get(r.term_id)! }))
        .filter((r) => r.term.start_date < m.date)
        .sort((a, b) => b.term.id - a.term.id)[0]
      seatsByLineage.set(m.related_lineage_id!, before?.seats ?? 0)
    }
    const winner = [...seatsByLineage.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    if (winner && !trunk.has(winner)) {
      trunk.add(winner)
      queue.push(winner)
    }
  }

  const points = allSeats
    .filter((r) => r.lineage_id && trunk.has(r.lineage_id))
    .map((r): PartyHistoryPoint => {
      const term = termById.get(r.term_id)!
      return {
        termNumber: term.number,
        year: Number(term.start_date.slice(0, 4)),
        seats: r.seats,
        totalSeats: term.total_seats,
        pctOfTotal: r.pct_of_total,
        partyNameAtTime: r.party_name,
      }
    })
    .sort((a, b) => a.termNumber - b.termNumber)

  const events = allEvents
    .filter((e) => trunk.has(e.lineage_id))
    .filter((e) => PRE_2005_SEATS_AVAILABLE || e.date >= FIRST_COVERED_YEAR_ISO)
    .map((e): PartyHistoryEvent => ({
      date: e.date,
      type: e.type,
      labelDe: e.label_de,
      side:
        e.type === 'merged_in' ? 'inbound'
        : e.type === 'merged_out' || e.type === 'split_out' ? 'outbound'
        : 'self',
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return { points, events }
}
