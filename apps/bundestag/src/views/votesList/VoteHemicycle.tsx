import { hemicycleSeats } from '@/lib/hemicycle'
import { useCopy } from '@/lib/i18n'

const RADII = Array.from({ length: 11 }, (_, i) => 54 + (i * (145 - 54)) / 10)

const COLORS = {
  yes: 'var(--color-success)',
  abstain: 'color-mix(in oklab, var(--color-fg) 40%, transparent)',
  absent: 'color-mix(in oklab, var(--color-fg) 15%, transparent)',
  no: 'var(--color-danger)',
}

type Props = { yes: number; no: number; abstain: number; absent: number; totalMembers: number }

export function VoteHemicycle({ yes, no, abstain, absent, totalMembers }: Props) {
  const t = useCopy()
  const seats = hemicycleSeats(totalMembers, RADII, 'centered')
  const fill = (i: number) =>
    i < yes ? COLORS.yes : i < yes + abstain ? COLORS.abstain : i < yes + abstain + absent ? COLORS.absent : COLORS.no
  return (
    <div className="flex w-[320px] max-w-full flex-col gap-m">
      <svg
        viewBox="0 0 320 165"
        className="block h-auto max-w-full"
        role="img"
        aria-label={`${t.yes} ${yes}, ${t.no} ${no}, ${t.abstain} ${abstain}, ${t.absentLabel} ${absent}`}
      >
        {seats.map((s, i) => (
          <circle
            key={i}
            cx={(160 + Math.cos(s.angle) * s.radius).toFixed(2)}
            cy={(158 - Math.sin(s.angle) * s.radius).toFixed(2)}
            r={2.4}
            fill={fill(i)}
          />
        ))}
      </svg>
      <div className="flex items-end justify-between px-xs">
        <div className="flex flex-col gap-xs">
          <span className="text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>{t.yes}</span>
          <span className="font-display text-[32px] font-semibold leading-[0.9] tracking-[-0.015em] tabular-nums" style={{ color: COLORS.yes }}>
            {yes}
          </span>
        </div>
        <div className="flex max-w-[140px] flex-col self-end pb-[4px] text-center text-s uppercase leading-normal opacity-m" style={{ letterSpacing: '0.08em' }}>
          {abstain > 0 && (
            <span>
              {abstain} {t.abstain}
            </span>
          )}
          <span>
            {absent} {t.absentLabel}
          </span>
        </div>
        <div className="flex flex-col items-end gap-xs">
          <span className="text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>{t.no}</span>
          <span className="font-display text-[32px] font-semibold leading-[0.9] tracking-[-0.015em] tabular-nums" style={{ color: COLORS.no }}>
            {no}
          </span>
        </div>
      </div>
    </div>
  )
}
