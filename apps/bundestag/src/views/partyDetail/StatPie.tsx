import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type Props = { label: string; value: number; color?: string; info?: string }

export function StatPie({ label, value, color = 'var(--color-success)', info }: Props) {
  const safe = Math.max(0, Math.min(1, value))
  const angle = safe * 360
  const large = safe > 0.5 ? 1 : 0
  const rad = (angle - 90) * (Math.PI / 180)
  const x = 50 + 42 * Math.cos(rad)
  const y = 50 + 42 * Math.sin(rad)
  const trackColor = 'color-mix(in oklab, var(--color-fg) 12%, transparent)'
  return (
    <div className="flex flex-col items-center gap-s">
      <div className="flex items-center gap-xs text-s caption opacity-l">
        <span>{label}</span>
        {info && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label="Info" className="opacity-l hover:opacity-100">
                <Info size={12} />
              </button>
            </TooltipTrigger>
            <TooltipContent style={{ width: 'min(320px, 90vw)' }}>{info}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="relative size-[120px]">
        <svg viewBox="0 0 100 100" className="size-full" role="img" aria-label={`${label} ${Math.round(safe * 100)}%`}>
          <circle cx={50} cy={50} r={42} fill={trackColor} stroke="var(--color-background)" strokeWidth={2} />
          {safe >= 0.999 ? (
            <circle cx={50} cy={50} r={42} fill={color} stroke="var(--color-background)" strokeWidth={2} />
          ) : (
            safe > 0 && (
              <path
                d={`M 50 50 L 50 8 A 42 42 0 ${large} 1 ${x} ${y} Z`}
                fill={color}
                stroke="var(--color-background)"
                strokeWidth={2}
              />
            )
          )}
          <circle cx={50} cy={50} r={22} fill="var(--color-background)" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-l font-semibold tabular-nums">
          {Math.round(safe * 100)}%
        </div>
      </div>
    </div>
  )
}
