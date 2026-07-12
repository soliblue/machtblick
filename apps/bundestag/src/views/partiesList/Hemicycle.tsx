import type { PartyListItem } from '@/server/parties'
import { hemicycleSeats } from '@/lib/hemicycle'
import { PARTY_COLOR } from '@/lib/parties'

type Props = { parties: PartyListItem[]; width?: number }

const SEATING_ORDER = ['Die Linke', 'B90/Grüne', 'SPD', 'fraktionslos', 'CDU/CSU', 'AfD']

export function Hemicycle({ parties, width = 720 }: Props) {
  const total = parties.reduce((a, p) => a + p.seats, 0)
  const rows = Math.max(4, Math.min(10, Math.round(Math.sqrt(total / 4))))
  const radii = Array.from({ length: rows }, (_, r) => 0.55 + (r / (rows - 1)) * 0.45)
  const seats = hemicycleSeats(total, radii, 'edge').map((s) => ({
    x: Math.cos(s.angle) * s.radius,
    y: -Math.sin(s.angle) * s.radius,
  }))

  const ordered = [
    ...SEATING_ORDER.map((p) => parties.find((x) => x.party === p)).filter((p): p is PartyListItem => Boolean(p)),
    ...parties.filter((p) => !SEATING_ORDER.includes(p.party)),
  ]
  const assignments: string[] = ordered.flatMap((p) => Array(p.seats).fill(p.party))

  const height = width * 0.55
  const cx = width / 2
  const cy = height - 8
  const drawR = width / 2 - 8
  const dotR = (drawR * 0.45) / rows / 2.4

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {seats.map((s, i) => (
        <rect
          key={i}
          x={(cx + s.x * drawR - dotR).toFixed(2)}
          y={(cy + s.y * drawR - dotR).toFixed(2)}
          width={(dotR * 2).toFixed(2)}
          height={(dotR * 2).toFixed(2)}
          fill={PARTY_COLOR[assignments[i]] ?? 'var(--color-gray)'}
        />
      ))}
    </svg>
  )
}
