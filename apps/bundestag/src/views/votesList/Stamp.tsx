import { useCopy } from '@/lib/i18n'

export type StampVariant =
  | 'angenommen'
  | 'abgelehnt'
  | 'knapp'
  | 'einstimmig'
  | 'fast-einstimmig'
  | 'abweichler'
  | 'beantwortet'
  | 'offen'
  | 'ueberwiesen'
  | 'beschlussempfehlung'
  | 'nicht-beraten'

const config: Record<StampVariant, { color: string; rotate: number; opacity?: number }> = {
  angenommen: { color: 'var(--color-success)', rotate: -4, opacity: 0.85 },
  abgelehnt: { color: 'var(--color-danger)', rotate: -5, opacity: 0.85 },
  knapp: { color: 'var(--color-orange)', rotate: 6, opacity: 0.85 },
  einstimmig: { color: 'var(--color-purple)', rotate: 3, opacity: 0.85 },
  'fast-einstimmig': { color: 'var(--color-purple)', rotate: 3, opacity: 0.85 },
  abweichler: { color: 'var(--color-fg)', rotate: 5, opacity: 0.75 },
  beantwortet: { color: 'var(--color-success)', rotate: -3, opacity: 0.85 },
  offen: { color: 'var(--color-danger)', rotate: 4, opacity: 0.85 },
  ueberwiesen: { color: 'var(--color-blue)', rotate: 4, opacity: 0.85 },
  beschlussempfehlung: { color: 'var(--color-purple)', rotate: -3, opacity: 0.85 },
  'nicht-beraten': { color: 'var(--color-fg)', rotate: 3, opacity: 0.7 },
}

type Props = { variant: StampVariant; size?: 's' | 'm'; rotated?: boolean }

export function Stamp({ variant, size = 's', rotated = true }: Props) {
  const t = useCopy()
  const { color, rotate, opacity = 0.85 } = config[variant]
  const sizeClass =
    size === 'm'
      ? 'px-m py-s text-s sm:text-m'
      : 'px-s py-xs text-[10px] sm:text-s'
  return (
    <span
      className={`inline-block font-semibold uppercase ${sizeClass}`}
      style={{
        border: `2.5px solid ${color}`,
        outline: `1px solid ${color}`,
        outlineOffset: '2px',
        color,
        opacity,
        transform: `rotate(${rotated ? rotate : 0}deg)`,
        letterSpacing: '0.12em',
        background: 'transparent',
        mixBlendMode: 'multiply',
        filter: 'url(#stamp-grunge) contrast(1.1)',
      }}
    >
      {t.stampClose[variant]}
    </span>
  )
}
