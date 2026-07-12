import type { PartyHistoryPoint } from '@/server/getPartyHistory'

export type ChartPoint = {
  termNumber: number
  termLabel: string
  seats: number
  totalSeats: number
  pctOfTotal: number
  pctValue: number
  partyNameAtTime: string
}

export function dedupePoints(points: PartyHistoryPoint[]): PartyHistoryPoint[] {
  const byTerm = new Map<number, PartyHistoryPoint>()
  for (const p of points) {
    const existing = byTerm.get(p.termNumber)
    if (!existing || p.seats > existing.seats) byTerm.set(p.termNumber, p)
  }
  return [...byTerm.values()].sort((a, b) => a.termNumber - b.termNumber)
}

export function toChartPoints(points: PartyHistoryPoint[], today: string): ChartPoint[] {
  return points.map((p, i) => {
    const next = points[i + 1]
    const termLabel = next ? `${p.year} - ${next.year - 1}` : `${p.year} - ${today}`
    return {
      termNumber: p.termNumber,
      termLabel,
      seats: p.seats,
      totalSeats: p.totalSeats,
      pctOfTotal: p.pctOfTotal,
      pctValue: p.pctOfTotal * 100,
      partyNameAtTime: p.partyNameAtTime,
    }
  })
}
