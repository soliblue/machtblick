import type { ReactNode } from 'react'

type Props = { accepted: boolean; children: ReactNode }

export function VerdictChip({ accepted, children }: Props) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-0 z-[1] flex h-[22px] -translate-x-1/2 -translate-y-1/2 items-center justify-center px-xl text-[11px] font-semibold uppercase leading-none text-white"
      style={{ letterSpacing: '0.14em', textIndent: '0.14em', background: accepted ? 'var(--color-success)' : 'var(--color-danger)' }}
    >
      {children}
    </div>
  )
}
