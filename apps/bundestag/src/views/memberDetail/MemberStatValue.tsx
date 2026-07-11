import type { ReactNode } from 'react'

type Props = { label: string; value: string; sub: ReactNode }

export function MemberStatValue({ label, value, sub }: Props) {
  return (
    <div className="flex min-w-0 flex-col items-center p-s text-center">
      <div className="font-display text-[32px] font-semibold leading-none tabular-nums">{value}</div>
      <span className="mt-s text-s caption opacity-l">{label}</span>
      <div className="mt-xs text-s caption">{sub}</div>
    </div>
  )
}
