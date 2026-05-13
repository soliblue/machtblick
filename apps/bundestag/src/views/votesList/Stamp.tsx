export type StampVariant =
  | 'angenommen'
  | 'abgelehnt'
  | 'knapp'
  | 'einstimmig'
  | 'fast-einstimmig'
  | 'abweichler'

const config: Record<StampVariant, { label: string; color: string; rotate: number; opacity?: number }> = {
  angenommen: { label: 'Angenommen', color: 'var(--color-success)', rotate: -4, opacity: 0.85 },
  abgelehnt: { label: 'Abgelehnt', color: 'var(--color-danger)', rotate: -5, opacity: 0.85 },
  knapp: { label: 'Knapp', color: 'var(--color-orange)', rotate: 6, opacity: 0.85 },
  einstimmig: { label: 'Einstimmig', color: 'var(--color-purple)', rotate: 3, opacity: 0.85 },
  'fast-einstimmig': { label: 'Fast einstimmig', color: 'var(--color-purple)', rotate: 3, opacity: 0.85 },
  abweichler: { label: 'Abweichler', color: 'var(--color-fg)', rotate: 5, opacity: 0.75 },
}

type Props = { variant: StampVariant; size?: 's' | 'm' }

export function Stamp({ variant, size = 's' }: Props) {
  const { label, color, rotate, opacity = 0.85 } = config[variant]
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
      {label}
    </span>
  )
}
