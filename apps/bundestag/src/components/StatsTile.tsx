import type { ReactNode } from 'react'

type Props = { label: string; children: ReactNode; hideOnMobile?: boolean }

export function StatsTile({ label, children, hideOnMobile = false }: Props) {
  return (
    <div className={`${hideOnMobile ? 'hidden desk:flex' : 'flex'} flex-col p-m`}>
      <div className="mx-auto w-full max-w-[140px]">{children}</div>
      <span className="mt-s text-center text-s caption opacity-l">{label}</span>
    </div>
  )
}
