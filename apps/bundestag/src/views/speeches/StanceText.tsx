import type { ReactNode } from 'react'
import type { SpeechBallotChoice } from '@/lib/speechesStatic'

export type Stance = 'yes' | 'no' | 'abstain' | 'split'

export const CHOICE_STANCE: Record<SpeechBallotChoice, Stance> = { ja: 'yes', nein: 'no', enthalten: 'abstain' }

const COLOR: Record<Stance, string> = {
  yes: 'var(--color-success)',
  no: 'var(--color-danger)',
  abstain: 'var(--color-yellow)',
  split: 'var(--color-fg)',
}

export function StanceText({ stance, children }: { stance: Stance; children: ReactNode }) {
  return (
    <span className="whitespace-nowrap text-s font-semibold caption" style={{ color: COLOR[stance] }}>
      {children}
    </span>
  )
}
