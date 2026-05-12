type Props = { value: number; color: string }

export function CohesionBar({ value, color }: Props) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center gap-m">
      <div
        className="h-1.5 flex-1 overflow-hidden"
        style={{ background: 'color-mix(in oklab, var(--color-fg) 10%, transparent)' }}
      >
        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
      </div>
      <span className="w-12 text-right text-s font-semibold">{pct}%</span>
    </div>
  )
}
