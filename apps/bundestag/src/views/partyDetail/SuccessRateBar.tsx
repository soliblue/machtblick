import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { pct } from '@/lib/format'
import { useCopy } from '@/lib/i18n'

type Props = { rate: number; matched: number; decided: number }

export function SuccessRateBar({ rate, matched, decided }: Props) {
  const t = useCopy()
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-xs text-s caption opacity-l">
        <span>{t.successRate}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" aria-label="Info" className="opacity-l hover:opacity-100">
              <Info size={12} />
            </button>
          </TooltipTrigger>
          <TooltipContent style={{ width: 'min(320px, 90vw)' }}>{t.successRateInfo}</TooltipContent>
        </Tooltip>
      </div>
      <div className="mt-xs font-display text-[32px] font-semibold leading-[0.9] tracking-[-0.015em] tabular-nums">{pct(rate)}</div>
      <div className="mt-s h-[6px] w-full bg-fg/15">
        <div className="h-full bg-success" style={{ width: pct(rate) }} />
      </div>
      <div className="mt-xs text-s caption opacity-l">
        {t.resultsMatchedLine.replace('{n}', String(matched)).replace('{total}', String(decided))}
      </div>
    </div>
  )
}
