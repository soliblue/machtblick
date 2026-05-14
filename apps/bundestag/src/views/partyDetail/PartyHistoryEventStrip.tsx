import { ArrowDownLeft, ArrowDownRight, Replace, Plus, X } from 'lucide-react'
import type { PartyHistoryEvent } from '@/server/getPartyHistory'
import { formatDate } from '@/lib/format'

export type StripEvent = PartyHistoryEvent & { anchorTerm: number; leading: boolean }

type Props = {
  events: StripEvent[]
  xMin: number
  xMax: number
  leftPad: number
  rightPad: number
}

const ICONS = {
  merged_in: ArrowDownLeft,
  merged_out: ArrowDownRight,
  split_out: ArrowDownRight,
  renamed: Replace,
  founded: Plus,
  dissolved: X,
} as const

export function PartyHistoryEventStrip({ events, xMin, xMax, leftPad, rightPad }: Props) {
  const range = Math.max(xMax - xMin, 1)
  const stacks = new Map<number, StripEvent[]>()
  for (const e of events) {
    const arr = stacks.get(e.anchorTerm) ?? []
    arr.push(e)
    stacks.set(e.anchorTerm, arr)
  }
  return (
    <div
      className="pointer-events-none absolute top-0 z-10"
      style={{ left: leftPad, right: rightPad, height: '100%' }}
    >
      {[...stacks.entries()].map(([term, group]) => {
        const pct = ((term - xMin) / range) * 100
        return (
          <div
            key={term}
            className="pointer-events-auto absolute top-0 flex flex-col items-center gap-xs"
            style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
          >
            {group.map((e, i) => {
              const Icon = ICONS[e.type]
              return (
                <div
                  key={`${e.date}-${i}`}
                  className="flex max-w-[140px] flex-col items-center gap-xs text-center"
                  title={`${formatDate(e.date)} - ${e.labelDe}${e.leading ? ' (vor dem Erfassungszeitraum)' : ''}`}
                >
                  <Icon size={14} strokeWidth={1.5} style={{ color: 'var(--color-fg)' }} />
                  <span className="text-s leading-tight" style={{ color: 'var(--color-fg)' }}>
                    {e.labelDe}
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
