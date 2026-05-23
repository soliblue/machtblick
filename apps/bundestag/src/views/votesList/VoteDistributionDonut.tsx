import { useState } from 'react'
import { useCopy } from '@/lib/i18n'

export type VoteChoice = 'yes' | 'no' | 'abstain' | 'absent'

type Props = {
  yes: number
  no: number
  abstain: number
  absent: number
  size?: number
  selected?: VoteChoice | null
  onSelect?: (choice: VoteChoice) => void
  showLabel?: boolean
}

const SEGMENTS: Array<{ key: VoteChoice; color: string }> = [
  { key: 'yes', color: 'var(--color-success)' },
  { key: 'no', color: 'var(--color-danger)' },
  { key: 'abstain', color: 'var(--color-yellow)' },
  { key: 'absent', color: 'color-mix(in oklab, var(--color-fg) 25%, var(--color-background))' },
]

export function VoteDistributionDonut({
  yes,
  no,
  abstain,
  absent,
  size = 80,
  selected,
  onSelect,
  showLabel = false,
}: Props) {
  const t = useCopy()
  const [hovered, setHovered] = useState<VoteChoice | null>(null)
  const values = { yes, no, abstain, absent }
  const total = yes + no + abstain + absent || 1
  const interactive = Boolean(onSelect)
  const active = hovered ?? selected ?? null
  const activeSeg = active ? SEGMENTS.find((s) => s.key === active)! : null
  const activeValue = active ? values[active] : total
  const activePct = activeValue === total ? 100 : Math.min(99, Math.round((activeValue / total) * 100))
  let angle = -Math.PI / 2
  const cx = 50
  const cy = 50
  const r = 46
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${t.yes} ${yes}, ${t.no} ${no}, ${t.abstain} ${abstain}, ${t.absent} ${absent}`}>
      {SEGMENTS.map((s) => {
        const v = values[s.key]
        if (v === 0) return null
        const isActive = active === s.key
        const opacity = !active || isActive ? 1 : 0.3
        const common = {
          fill: s.color,
          stroke: 'var(--color-background)',
          strokeWidth: 2,
          strokeLinejoin: 'round' as const,
          opacity,
          style: { cursor: interactive ? 'pointer' : undefined, transition: 'opacity 120ms' },
          onClick: interactive ? () => onSelect!(s.key) : undefined,
          onMouseEnter: () => setHovered(s.key),
          onMouseLeave: () => setHovered(null),
        }
        if (v === total) {
          return <circle key={s.key} cx={cx} cy={cy} r={r} {...common} />
        }
        const sweep = (v / total) * Math.PI * 2
        const midAngle = angle + sweep / 2
        const offset = isActive ? 4 : 0
        const ox = Math.cos(midAngle) * offset
        const oy = Math.sin(midAngle) * offset
        const x1 = cx + r * Math.cos(angle) + ox
        const y1 = cy + r * Math.sin(angle) + oy
        const x2 = cx + r * Math.cos(angle + sweep) + ox
        const y2 = cy + r * Math.sin(angle + sweep) + oy
        const large = sweep > Math.PI ? 1 : 0
        const d = `M ${cx + ox} ${cy + oy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
        angle += sweep
        return <path key={s.key} d={d} {...common} />
      })}
      <g style={{ pointerEvents: 'none' }}>
        <circle cx="50" cy="50" r="22" fill="var(--color-background)" />
        {showLabel && (
          <>
            <text
              x="50"
              y={activeSeg ? '46' : '54'}
              textAnchor="middle"
              style={{ fontSize: 9, fontWeight: 600, fill: 'var(--color-fg)' }}
            >
              {activeSeg ? ({ yes: t.yes, no: t.no, abstain: t.abstain, absent: t.absent }[activeSeg.key]) : total}
            </text>
            {activeSeg && (
              <text
                x="50"
                y="58"
                textAnchor="middle"
                style={{ fontSize: 7, fill: 'var(--color-fg)', opacity: 0.7 }}
              >
                {activeValue} · {activePct}%
              </text>
            )}
          </>
        )}
      </g>
    </svg>
  )
}
