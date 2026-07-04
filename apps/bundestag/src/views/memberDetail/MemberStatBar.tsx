import type { ReactNode } from 'react'

type Props = { label: string; value: string; sub?: ReactNode }

export function MemberStatBar({ label, value, sub }: Props) {
  return (
    <div className="min-w-0">
      <div className="text-s caption opacity-l">{label}</div>
      <div className="mt-xs font-display text-[32px] font-semibold leading-[0.9] tracking-[-0.015em] tabular-nums">{value}</div>
      <div className="mt-s h-[6px] w-full bg-fg/15">
        <div className="h-full bg-success" style={{ width: value }} />
      </div>
      {sub !== undefined && <div className="mt-xs text-s caption">{sub}</div>}
    </div>
  )
}
