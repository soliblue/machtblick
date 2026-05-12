import type { PartyListItem } from '@/server/parties'
import { PARTY_COLOR, PARTY_LABEL } from '@/lib/parties'

type Props = { parties: PartyListItem[]; width?: number }

const SEATING_ORDER = ['Die Linke', 'B90/Grüne', 'SPD', 'fraktionslos', 'CDU/CSU', 'AfD']

export function Hemicycle({ parties, width = 720 }: Props) {
  const total = parties.reduce((a, p) => a + p.seats, 0)
  const rows = Math.max(4, Math.min(10, Math.round(Math.sqrt(total / 4))))
  const radii = Array.from({ length: rows }, (_, r) => 0.55 + (r / (rows - 1)) * 0.45)
  const radiusSum = radii.reduce((a, b) => a + b, 0)
  const rowCounts = radii.map((r) => Math.round((r / radiusSum) * total))
  let diff = total - rowCounts.reduce((a, b) => a + b, 0)
  for (let i = rowCounts.length - 1; diff !== 0; i = (i - 1 + rowCounts.length) % rowCounts.length) {
    rowCounts[i] += Math.sign(diff)
    diff -= Math.sign(diff)
  }

  const seats = rowCounts.flatMap((count, r) =>
    Array.from({ length: count }, (_, s) => {
      const t = count === 1 ? 0.5 : s / (count - 1)
      const angle = Math.PI - t * Math.PI
      return { x: Math.cos(angle) * radii[r], y: -Math.sin(angle) * radii[r], angle, row: r }
    }),
  )
  seats.sort((a, b) => b.angle - a.angle || a.row - b.row)

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
    <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
      {seats.map((s, i) => (
        <circle
          key={i}
          cx={cx + s.x * drawR}
          cy={cy + s.y * drawR}
          r={dotR}
          fill={PARTY_COLOR[assignments[i]] ?? 'var(--color-gray)'}
        />
      ))}
    </svg>
  )
}

export function HemicycleLegend({ parties }: { parties: PartyListItem[] }) {
  return (
    <div className="mt-s flex flex-wrap justify-center gap-l text-s">
      {parties.map((p) => (
        <span key={p.slug} className="flex items-center gap-xs">
          <span className="inline-block size-2" style={{ background: PARTY_COLOR[p.party] ?? 'var(--color-gray)' }} />
          {PARTY_LABEL[p.party] ?? p.party} {p.seats}
        </span>
      ))}
    </div>
  )
}
