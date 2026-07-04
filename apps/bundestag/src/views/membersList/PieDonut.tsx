import { useState } from 'react'
import { useCopy } from '@/lib/i18n'

export type DonutSlice = { key: string; label: string; count: number; color: string }

type Props = { data: DonutSlice[] }

const coord = (value: number) => Math.round(value * 1000) / 1000

export function PieDonut({ data }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const total = data.reduce((s, d) => s + d.count, 0)
  const activeKey = hovered ?? selected
  const largest = data.reduce((max, d) => (d.count > max.count ? d : max), data[0] ?? { key: '', label: '', count: 0, color: '' })
  const shown = data.find((d) => d.key === activeKey) ?? largest
  const shownPct = shown.count === total ? 100 : Math.min(99, Math.round((shown.count / total) * 100))
  let angle = -Math.PI / 2
  const cx = 50
  const cy = 50
  const r = 46
  return total === 0 ? (
    <PieDonutEmpty />
  ) : (
    <svg
      viewBox="0 0 100 100"
      className="h-auto w-full"
      role="img"
      aria-label={data.filter((d) => d.count > 0).map((d) => `${d.label} ${d.count}`).join(', ')}
    >
      {data.map((d) => {
        if (d.count === 0) return null
        const isActive = activeKey === d.key
        const common = {
          fill: d.color,
          stroke: 'var(--color-background)',
          strokeWidth: 2,
          strokeLinejoin: 'round' as const,
          opacity: !activeKey || isActive ? 1 : 0.3,
          style: { cursor: 'pointer', transition: 'opacity 120ms' },
          onClick: () => setSelected((prev) => (prev === d.key ? null : d.key)),
          onMouseEnter: () => setHovered(d.key),
          onMouseLeave: () => setHovered(null),
        }
        if (d.count === total) {
          return <circle key={d.key} cx={cx} cy={cy} r={r} {...common} />
        }
        const sweep = (d.count / total) * Math.PI * 2
        const midAngle = angle + sweep / 2
        const offset = isActive ? 4 : 0
        const ox = Math.cos(midAngle) * offset
        const oy = Math.sin(midAngle) * offset
        const x1 = cx + r * Math.cos(angle) + ox
        const y1 = cy + r * Math.sin(angle) + oy
        const x2 = cx + r * Math.cos(angle + sweep) + ox
        const y2 = cy + r * Math.sin(angle + sweep) + oy
        const large = sweep > Math.PI ? 1 : 0
        const path = `M ${coord(cx + ox)} ${coord(cy + oy)} L ${coord(x1)} ${coord(y1)} A ${r} ${r} 0 ${large} 1 ${coord(x2)} ${coord(y2)} Z`
        angle += sweep
        return <path key={d.key} d={path} {...common} />
      })}
      <g style={{ pointerEvents: 'none' }}>
        <circle cx={cx} cy={cy} r="28" fill="var(--color-background)" />
        <text
          x="50"
          y="48"
          textAnchor="middle"
          style={{ fontSize: 12, fontWeight: 600, fill: 'var(--color-fg)', fontVariantNumeric: 'tabular-nums' }}
        >
          {shownPct}%
        </text>
        <text
          x="50"
          y="59"
          textAnchor="middle"
          style={{ fontSize: 6.5, fill: 'var(--color-fg)', opacity: 0.7 }}
        >
          {shown.label}
        </text>
      </g>
    </svg>
  )
}

function PieDonutEmpty() {
  const t = useCopy()
  return (
    <div className="flex aspect-square w-full items-center justify-center rounded-full border border-dashed border-fg/15">
      <span className="text-s opacity-l">{t.noData}</span>
    </div>
  )
}
