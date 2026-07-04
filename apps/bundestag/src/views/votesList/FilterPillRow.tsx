import type { ReactNode } from 'react'
import { Filter } from 'lucide-react'

type Props = { children: ReactNode; className?: string }

export function FilterPillRow({ children, className = 'mb-l' }: Props) {
  return (
    <div className={`${className} -mx-l -my-[7px] flex items-center gap-s overflow-x-auto px-l py-[7px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
      <Filter size={14} className="shrink-0 opacity-l" aria-hidden="true" />
      {children}
    </div>
  )
}
