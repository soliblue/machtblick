import type { ReactNode } from 'react'
import { SERIF } from '@/lib/fonts'

export function MpEmpty({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-l py-xl">
      <p className="text-m opacity-l" style={{ fontFamily: SERIF }}>{children}</p>
    </main>
  )
}
