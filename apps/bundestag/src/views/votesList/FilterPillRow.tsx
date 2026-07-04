import type { ReactNode } from 'react'
import { Filter } from 'lucide-react'

type Props = { children: ReactNode; className?: string }

export function FilterPillRow({ children, className = 'mb-l' }: Props) {
  return (
    <div className={`${className} -mx-l -my-s flex items-center gap-s overflow-x-auto px-l py-s [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
      <Filter size={14} className="shrink-0 opacity-l" aria-hidden="true" />
      {children}
    </div>
  )
}
