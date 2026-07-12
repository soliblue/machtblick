import { memo, useMemo, type ReactNode } from 'react'
import { hemicycleSeats } from '@/lib/hemicycle'
import { useCopy } from '@/lib/i18n'
import type { VoteChoice } from './VoteDistributionDonut'

const RADII = Array.from({ length: 11 }, (_, i) => 54 + (i * (145 - 54)) / 10)

const COLORS: Record<VoteChoice, string> = {
  yes: 'var(--color-success)',
  abstain: 'color-mix(in oklab, var(--color-fg) 40%, transparent)',
  absent: 'color-mix(in oklab, var(--color-fg) 15%, transparent)',
  no: 'var(--color-danger)',
}

type Props = {
  yes: number
  no: number
  abstain: number
  absent: number | null
  totalMembers: number
  hero?: boolean
  selected?: VoteChoice | null
  onSelect?: (choice: VoteChoice) => void
}

type LegendBlockProps = {
  choice: VoteChoice
  selected: VoteChoice | null
  onSelect?: (choice: VoteChoice) => void
  className?: string
  children: ReactNode
}

function LegendBlock({ choice, selected, onSelect, className = '', children }: LegendBlockProps) {
  const style = { opacity: selected && selected !== choice ? 0.4 : 1, transition: 'opacity 120ms' }
  return onSelect ? (
    <button type="button" onClick={() => onSelect(choice)} aria-pressed={selected === choice} className={className} style={style}>
      {children}
    </button>
  ) : (
    <div className={className} style={style}>
      {children}
    </div>
  )
}

export const VoteHemicycle = memo(function VoteHemicycle({ yes, no, abstain, absent, totalMembers, hero = false, selected = null, onSelect }: Props) {
  const t = useCopy()
  const seats = useMemo(() => hemicycleSeats(totalMembers, RADII, 'centered'), [totalMembers])
  const noData = Math.max(0, totalMembers - yes - no - abstain - (absent ?? 0))
  const choiceAt = (i: number): VoteChoice =>
    i < yes ? 'yes' : i < yes + abstain ? 'abstain' : i < yes + abstain + (absent ?? 0) + noData ? 'absent' : 'no'
  const numeral = `font-display font-semibold leading-[0.9] tracking-[-0.015em] tabular-nums ${hero ? 'text-[40px]' : 'text-[32px]'}`
  return (
    <div className={`flex flex-col gap-m ${hero ? 'w-full max-w-[440px]' : 'w-[320px] max-w-full'}`}>
      <svg
        viewBox="0 0 320 165"
        className="block h-auto max-w-full"
        role="img"
        aria-label={absent === null
          ? [`${t.yes} ${yes}`, `${t.no} ${no}`, `${t.abstain} ${abstain}`, ...(noData > 0 ? [`${t.noDataLabel} ${noData}`] : [])].join(', ')
          : `${t.yes} ${yes}, ${t.no} ${no}, ${t.abstain} ${abstain}, ${t.absentLabel} ${absent}`}
      >
        {seats.map((s, i) => {
          const choice = choiceAt(i)
          return (
            <circle
              key={i}
              cx={(160 + Math.cos(s.angle) * s.radius).toFixed(2)}
              cy={(158 - Math.sin(s.angle) * s.radius).toFixed(2)}
              r={2.4}
              fill={COLORS[choice]}
              opacity={selected && selected !== choice ? 0.15 : 1}
              style={{ transition: 'opacity 120ms' }}
            />
          )
        })}
      </svg>
      <div className="flex items-end justify-between px-xs">
        <LegendBlock choice="yes" selected={selected} onSelect={onSelect} className="flex flex-col items-start gap-xs">
          <span className="text-s caption opacity-l">{t.yes}</span>
          <span className={numeral} style={{ color: COLORS.yes }}>{yes}</span>
        </LegendBlock>
        <div className="flex max-w-[140px] flex-col self-end pb-xs text-center text-s caption leading-normal opacity-l">
          {abstain > 0 && (
            <LegendBlock choice="abstain" selected={selected} onSelect={onSelect}>
              {abstain} {hero ? t.abstention : t.abstain}
            </LegendBlock>
          )}
          {absent === null ? (
            noData > 0 && <div>{noData} {t.noDataLabel}</div>
          ) : (
            <LegendBlock choice="absent" selected={selected} onSelect={onSelect}>
              {absent} {t.absentLabel}
            </LegendBlock>
          )}
        </div>
        <LegendBlock choice="no" selected={selected} onSelect={onSelect} className="flex flex-col items-end gap-xs">
          <span className="text-s caption opacity-l">{t.no}</span>
          <span className={numeral} style={{ color: COLORS.no }}>{no}</span>
        </LegendBlock>
      </div>
    </div>
  )
})
