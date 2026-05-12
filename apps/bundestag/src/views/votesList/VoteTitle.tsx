import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type Props = {
  title: string
  as?: 'div' | 'h1'
  className?: string
  style?: React.CSSProperties
  iconSize?: number
}

const REJECTION_PREFIX = /^(Ablehnung\s+(?:des|der|eines|einer)\s+(?:[\wÄÖÜäöüß-]+-Antrags?|Antrags?)\s*:?)\s*/

export function VoteTitle({
  title,
  as: Tag = 'div',
  className = 'font-display text-[18px] leading-snug sm:text-[21px]',
  style = { fontWeight: 500 },
  iconSize = 15,
}: Props) {
  const match = title.match(REJECTION_PREFIX)
  if (!match) {
    return <Tag className={className} style={style}>{title}</Tag>
  }
  const prefix = match[1]
  const rest = title.slice(match[0].length)
  return (
    <Tag className={className} style={style}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
            className="relative z-10 cursor-help"
            style={{ color: 'var(--color-danger)' }}
            aria-label="Was ist eine Ablehnungsempfehlung?"
          >
            <Info size={iconSize} className="mr-xs inline" style={{ verticalAlign: '-2px' }} />
            {prefix}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-md text-s leading-snug" style={{ width: 'min(440px, 90vw)' }}>
          Der Ausschuss empfiehlt, den Antrag abzulehnen. Ja-Stimmen folgen der Empfehlung (Antrag fällt), Nein-Stimmen lehnen die Empfehlung ab (Antrag bleibt offen, wird aber nicht automatisch angenommen). In der Praxis folgt das Plenum fast immer der Empfehlung.
        </TooltipContent>
      </Tooltip>
      {' '}{rest}
    </Tag>
  )
}
