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

const config: Record<StampVariant, { color: string; rotate: number; opacity?: number }> = {
  angenommen: { color: 'var(--color-success)', rotate: -4, opacity: 0.85 },
  abgelehnt: { color: 'var(--color-danger)', rotate: -5, opacity: 0.85 },
  knapp: { color: 'var(--color-orange)', rotate: 6, opacity: 0.85 },
  einstimmig: { color: 'var(--color-purple)', rotate: 3, opacity: 0.85 },
  'fast-einstimmig': { color: 'var(--color-purple)', rotate: 3, opacity: 0.85 },
  abweichler: { color: 'var(--color-fg)', rotate: 5, opacity: 0.75 },
  beantwortet: { color: 'var(--color-success)', rotate: -3, opacity: 0.85 },
  offen: { color: 'var(--color-danger)', rotate: 4, opacity: 0.85 },
}

type Props = { variant: StampVariant; size?: 's' | 'm' }

export function Stamp({ variant, size = 's' }: Props) {
  const t = useCopy()
  const { color, rotate, opacity = 0.85 } = config[variant]
  const sizeClass =
    size === 'm'
      ? 'px-[10px] py-[6px] text-[12px] sm:px-[12px] sm:py-[8px] sm:text-[14px]'
      : 'px-[6px] py-[3px] text-[10px] sm:px-[8px] sm:py-[4px] sm:text-[12px]'
  return (
    <span
      className={`inline-block font-semibold uppercase ${sizeClass}`}
      style={{
        border: `2.5px solid ${color}`,
        outline: `1px solid ${color}`,
        outlineOffset: '2px',
        color,
        opacity,
        transform: `rotate(${rotate}deg)`,
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
