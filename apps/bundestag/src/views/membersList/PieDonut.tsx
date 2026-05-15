import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { useCopy } from '@/lib/i18n'

type Slice = { key: string; label: string; count: number; color: string }

type Props = { data: Slice[] }

export function PieDonut({ data }: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const t = useCopy()
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) return <PieDonutEmpty />
  const largest = data.reduce((max, d) => (d.count > max.count ? d : max), data[0])
  const active = data.find((d) => d.key === selectedKey) ?? largest
  const label = t.ageLabels[active.key as keyof typeof t.ageLabels] ?? t.sexLabels[active.key as keyof typeof t.sexLabels] ?? active.label
  const pct = Math.round((active.count / total) * 100)
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center">
      <div className="relative h-full max-h-[128px] w-[128px] md:max-h-[148px] md:w-[148px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius="62%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              stroke="var(--color-background)"
              strokeWidth={1}
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell
                  key={d.key}
                  fill={d.color}
                  fillOpacity={selectedKey === null || selectedKey === d.key ? 1 : 0.35}
                  cursor="pointer"
                  onClick={() => setSelectedKey((prev) => (prev === d.key ? null : d.key))}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">
          <span className="text-l font-semibold tabular-nums">{pct} %</span>
          <span className="mt-xs text-s opacity-l">{label}</span>
        </div>
      </div>
    </div>
  )
}

function PieDonutEmpty() {
  const t = useCopy()
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center">
      <div
        className="flex h-[128px] w-[128px] items-center justify-center rounded-full md:h-[148px] md:w-[148px]"
        style={{ border: '1px dashed color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
      >
        <span className="text-s opacity-l">{t.noData}</span>
      </div>
    </div>
  )
}
