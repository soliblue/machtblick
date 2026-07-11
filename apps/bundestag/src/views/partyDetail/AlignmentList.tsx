import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { PartyAlignment } from '@/server/partyDetail'
import { PARTY_SLUG, partyLabel } from '@/lib/parties'
import { PartyLogo } from '@/views/votesList/PartyLogo'
import { pct } from '@/lib/format'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

type Props = { alignments: PartyAlignment[] }

export function AlignmentList({ alignments }: Props) {
  const locale = useLocale()
  const t = useCopy()
  return (
    <div className="flex flex-col">
      {alignments.map((a) => {
        const slug = PARTY_SLUG[a.party]
        const label = partyLabel(a.party, locale)
        const row = (
          <div className="grid grid-cols-[112px_minmax(0,1fr)_3.5rem] items-center gap-m py-s">
            <span className="flex min-w-0 items-center gap-s">
              <PartyLogo party={a.party} size={20} decorative />
              <span className="truncate text-m font-semibold">{label}</span>
            </span>
            <div className="h-[3px] bg-fg/15">
              <div className="h-full bg-success" style={{ width: pct(a.agreement) }} />
            </div>
            <div className="text-right text-m font-semibold tabular-nums">{pct(a.agreement)}</div>
          </div>
        )
        return (
          <Tooltip key={a.party}>
            <TooltipTrigger asChild>
              {slug ? (
                <a
                  href={withLocale(`/parties/${slug}/`, locale)}
                  aria-label={label}
                  className="block transition-opacity hover:opacity-80"
                >
                  {row}
                </a>
              ) : (
                <div>{row}</div>
              )}
            </TooltipTrigger>
            <TooltipContent>
              {t.agreementTooltip.replace('{pct}', pct(a.agreement)).replace('{n}', String(a.sharedVotes))}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
