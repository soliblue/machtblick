import { useState } from 'react'
import { useCopy } from '@/lib/i18n'
import { DonutSlices } from '@/components/DonutSlices'

export type DonutSlice = { key: string; label: string; count: number; color: string }

type Props = { data: DonutSlice[] }

export function PieDonut({ data }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const total = data.reduce((s, d) => s + d.count, 0)
  const activeKey = hovered ?? selected
  const largest = data.reduce((max, d) => (d.count > max.count ? d : max), data[0] ?? { key: '', label: '', count: 0, color: '' })
  const shown = data.find((d) => d.key === activeKey) ?? largest
  const shownPct = shown.count === total ? 100 : Math.min(99, Math.round((shown.count / total) * 100))
  return total === 0 ? (
    <PieDonutEmpty />
  ) : (
    <svg
      viewBox="0 0 100 100"
      className="h-auto w-full"
      role="img"
      aria-label={data.filter((d) => d.count > 0).map((d) => `${d.label} ${d.count}`).join(', ')}
    >
      <DonutSlices
        segments={data.map((d) => ({ key: d.key, value: d.count, color: d.color }))}
        total={total}
        activeKey={activeKey}
        onHover={setHovered}
        onSegmentClick={(key) => setSelected((prev) => (prev === key ? null : key))}
      />
      <g style={{ pointerEvents: 'none' }}>
        <circle cx="50" cy="50" r="28" fill="var(--color-background)" />
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
