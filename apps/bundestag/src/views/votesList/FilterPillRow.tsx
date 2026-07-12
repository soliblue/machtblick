import type { ReactNode } from 'react'
import { Filter } from 'lucide-react'

type Props = { children: ReactNode }

export function FilterPillRow({ children }: Props) {
  return (
    <div className={' -mx-l -my-s flex items-center gap-s overflow-x-auto px-l py-s [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'}>
      <Filter size={14} className="shrink-0 opacity-l" aria-hidden="true" />
      {children}
    </div>
  )
}
