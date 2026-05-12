import type { MemberAnfragen } from '@/server/anfragen'

type Props = { data: MemberAnfragen }

export function AnfragenSummary({ data }: Props) {
  const { byType, total } = data
  const segments: Array<{ label: string; value: number; opacity: number }> = [
    { label: `${byType.kleine} Kleine`, value: byType.kleine, opacity: 0.7 },
    { label: `${byType.grosse} Große`, value: byType.grosse, opacity: 0.55 },
    { label: `${byType.schriftlich} Schriftliche`, value: byType.schriftlich, opacity: 0.4 },
  ]
  return (
    <div className="flex flex-col gap-s">
      <div className="flex flex-wrap items-baseline gap-m text-m">
        {segments.map((s) => (
          <span key={s.label} className="tabular-nums">{s.label}</span>
        ))}
        <span className="ml-auto text-s opacity-l tabular-nums">{total} Anfragen, WP21</span>
      </div>
      <div className="flex h-2 w-full gap-[2px] overflow-hidden">
        {segments.filter((s) => s.value > 0).map((s) => (
          <div
            key={s.label}
            style={{
              flexGrow: s.value,
              flexShrink: 1,
              flexBasis: 0,
              background: 'var(--color-fg)',
              opacity: s.opacity,
            }}
          />
        ))}
      </div>
    </div>
  )
}
