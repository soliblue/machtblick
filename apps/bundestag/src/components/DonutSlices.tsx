export type DonutSegment<K extends string> = { key: K; value: number; color: string }

type Props<K extends string> = {
  segments: DonutSegment<K>[]
  total: number
  activeKey: K | null
  onHover: (key: K | null) => void
  onSegmentClick?: (key: K) => void
}

const coord = (value: number) => Math.round(value * 1000) / 1000

export function DonutSlices<K extends string>({ segments, total, activeKey, onHover, onSegmentClick }: Props<K>) {
  let angle = -Math.PI / 2
  const cx = 50
  const cy = 50
  const r = 46
  return (
    <>
      {segments.map((s) => {
        if (s.value === 0) return null
        const isActive = activeKey === s.key
        const common = {
          fill: s.color,
          stroke: 'var(--color-background)',
          strokeWidth: 2,
          strokeLinejoin: 'round' as const,
          opacity: !activeKey || isActive ? 1 : 0.3,
          style: { cursor: onSegmentClick ? ('pointer' as const) : undefined, transition: 'opacity 120ms' },
          onClick: onSegmentClick ? () => onSegmentClick(s.key) : undefined,
          onMouseEnter: () => onHover(s.key),
          onMouseLeave: () => onHover(null),
        }
        if (s.value === total) {
          return <circle key={s.key} cx={cx} cy={cy} r={r} {...common} />
        }
        const sweep = (s.value / total) * Math.PI * 2
        const midAngle = angle + sweep / 2
        const offset = isActive ? 4 : 0
        const ox = Math.cos(midAngle) * offset
        const oy = Math.sin(midAngle) * offset
        const x1 = cx + r * Math.cos(angle) + ox
        const y1 = cy + r * Math.sin(angle) + oy
        const x2 = cx + r * Math.cos(angle + sweep) + ox
        const y2 = cy + r * Math.sin(angle + sweep) + oy
        const large = sweep > Math.PI ? 1 : 0
        const d = `M ${coord(cx + ox)} ${coord(cy + oy)} L ${coord(x1)} ${coord(y1)} A ${r} ${r} 0 ${large} 1 ${coord(x2)} ${coord(y2)} Z`
        angle += sweep
        return <path key={s.key} d={d} {...common} />
      })}
    </>
  )
}
