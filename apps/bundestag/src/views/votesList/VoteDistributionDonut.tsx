import { memo, useState } from 'react'
import { useCopy } from '@/lib/i18n'
import { DonutSlices } from '@/components/DonutSlices'

export type VoteChoice = 'yes' | 'no' | 'abstain' | 'absent'

type Props = {
  yes: number
  no: number
  abstain: number
  absent: number
  size?: number
  selected?: VoteChoice | null
}

const VOTE_SEGMENTS: Array<{ key: VoteChoice; color: string }> = [
  { key: 'yes', color: 'var(--color-success)' },
  { key: 'no', color: 'var(--color-danger)' },
  { key: 'abstain', color: 'var(--color-yellow)' },
  { key: 'absent', color: 'color-mix(in oklab, var(--color-fg) 25%, var(--color-background))' },
]

export const VoteDistributionDonut = memo(function VoteDistributionDonut({ yes, no, abstain, absent, size = 80, selected }: Props) {
  const t = useCopy()
  const [hovered, setHovered] = useState<VoteChoice | null>(null)
  const values = { yes, no, abstain, absent }
  const total = yes + no + abstain + absent || 1
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${t.yes} ${yes}, ${t.no} ${no}, ${t.abstain} ${abstain}, ${t.absent} ${absent}`}>
      <DonutSlices
        segments={VOTE_SEGMENTS.map((s) => ({ key: s.key, value: values[s.key], color: s.color }))}
        total={total}
        activeKey={hovered ?? selected ?? null}
        onHover={setHovered}
      />
      <g style={{ pointerEvents: 'none' }}>
        <circle cx="50" cy="50" r="22" fill="var(--color-background)" />
      </g>
    </svg>
  )
})
