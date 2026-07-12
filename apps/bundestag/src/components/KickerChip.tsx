import type { ReactNode } from 'react'

type Props = { children: ReactNode }

export function KickerChip({ children }: Props) {
  return (
    <span className="inline-flex h-[20px] items-center rounded-m border border-fg/40 px-s text-[11px] font-semibold uppercase leading-none" style={{ letterSpacing: '0.14em' }}>
      {children}
    </span>
  )
}
