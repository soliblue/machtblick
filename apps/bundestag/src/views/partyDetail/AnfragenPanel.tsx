import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { PartyAnfragenStats, PartyAnfragenTopic, PartyAnfragenTypeSplit } from '@/server/anfragenStats'

const ROW_BORDER = 'color-mix(in oklab, var(--color-fg) 15%, transparent)'

type Props = { data: PartyAnfragenStats }

export function AnfragenPanel({ data }: Props) {
  return (
    <div className="mt-xl">
      <div className="flex items-center justify-between text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>
        <span>Anfragen</span>
        <span className="tabular-nums">{data.total} in WP21</span>
      </div>
      {data.total > 0 ? (
        <>
          <TypSplit split={data.byType} />
          {data.topSachgebiete.length > 0 && <TopicList caption="Top Themen" rows={data.topSachgebiete} />}
          {data.topDeskriptoren.length > 0 && <DeskriptorCloud chips={data.topDeskriptoren} />}
        </>
      ) : (
        <div className="mt-s border p-l text-center text-m opacity-l" style={{ borderColor: ROW_BORDER }}>
          Diese Fraktion hat keine Anfragen mitgezeichnet.
        </div>
      )}
    </div>
  )
}

const SEGMENT_OPACITY = [0.7, 0.55, 0.4]
const TYP_LABEL: Record<keyof Omit<PartyAnfragenTypeSplit, 'total'>, string> = {
  kleine: 'Kleine',
  grosse: 'Große',
  schriftlich: 'Schriftliche',
}

function TypSplit({ split }: { split: PartyAnfragenTypeSplit }) {
  const segments = (Object.keys(TYP_LABEL) as Array<keyof typeof TYP_LABEL>)
    .map((k) => ({ key: k, label: TYP_LABEL[k], count: split[k] }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)
  return (
    <div className="mt-m">
      <div className="mb-xs text-s opacity-m">Typ</div>
      <div className="flex h-8 w-full gap-[2px] overflow-hidden">
        {segments.map((s, i) => {
          const pctNum = Math.round((s.count / split.total) * 100)
          return (
            <Tooltip key={s.key}>
              <TooltipTrigger asChild>
                <div
                  className="cursor-default transition-opacity hover:opacity-100"
                  style={{
                    flexGrow: s.count,
                    flexShrink: 1,
                    flexBasis: 0,
                    background: 'var(--color-fg)',
                    opacity: SEGMENT_OPACITY[i] ?? 0.4,
                  }}
                  aria-label={`${s.label} · ${s.count} · ${pctNum}%`}
                />
              </TooltipTrigger>
              <TooltipContent>
                <div className="font-semibold">{s.label} Anfrage</div>
                <div className="opacity-l tabular-nums">{s.count} · {pctNum}%</div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}

function TopicList({ caption, rows }: { caption: string; rows: PartyAnfragenTopic[] }) {
  const max = rows[0].count
  return (
    <div className="mt-m">
      <div className="mb-xs text-s opacity-m">{caption}</div>
      <div className="flex flex-col">
        {rows.map((r) => (
          <Tooltip key={r.name}>
            <TooltipTrigger asChild>
              <div
                className="grid cursor-default grid-cols-[1fr_auto_2fr] items-center gap-m py-xs transition-colors hover:bg-surface"
              >
                <span className="text-s">{r.name}</span>
                <span className="text-s font-semibold tabular-nums">{r.count}</span>
                <div className="h-2 w-full" style={{ background: 'transparent' }}>
                  <div
                    style={{
                      width: `${(r.count / max) * 100}%`,
                      background: 'var(--color-fg)',
                      opacity: 0.55,
                      height: '100%',
                    }}
                  />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="font-semibold">{r.name}</div>
              <div className="opacity-l tabular-nums">{r.count} Anfragen</div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}

function DeskriptorCloud({ chips }: { chips: PartyAnfragenTopic[] }) {
  return (
    <div className="mt-m">
      <div className="mb-xs text-s opacity-m">Top Schlagworte</div>
      <div className="flex flex-wrap gap-xs">
        {chips.map((c) => (
          <Tooltip key={c.name}>
            <TooltipTrigger asChild>
              <span
                className="cursor-default px-s py-xs text-s transition-colors hover:bg-surface"
                style={{ border: `1px solid ${ROW_BORDER}` }}
              >
                #{c.name}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <div className="font-semibold">{c.name}</div>
              <div className="opacity-l tabular-nums">{c.count} Anfragen</div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
