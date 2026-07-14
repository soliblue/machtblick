import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { PartyProposal } from '@/server/partyDetail'
import { formatDate } from '@/lib/format'
import { useCopy, useLocale } from '@/lib/i18n'

type Props = { proposals: PartyProposal[]; party: string }

export function ProposalsBar({ proposals, party }: Props) {
  const total = proposals.length
  const accepted = proposals.filter((p) => p.result === 'angenommen').length
  const locale = useLocale()
  const t = useCopy()
  const resultLabel = { angenommen: t.accepted, abgelehnt: t.rejected }
  return (
    <div>
      <div className="flex items-center justify-between text-s caption opacity-l">
        <span>{t.proposals}</span>
        <span>{accepted} / {total} {t.acceptedCount}</span>
      </div>
      <a
        href={`${locale === 'en' ? '/en/' : '/'}?party=${encodeURIComponent(party)}`}
        className="mt-s flex h-8 w-full gap-[2px] overflow-hidden transition-opacity hover:opacity-80"
        aria-label={`${t.proposals}: ${accepted} / ${total} ${t.acceptedCount}`}
      >
        {proposals.map((p) => (
          <Tooltip key={p.voteId}>
            <TooltipTrigger asChild>
              <span
                className="flex-1 transition-opacity hover:opacity-70"
                style={{
                  background: p.result === 'angenommen' ? 'var(--color-success)' : 'var(--color-danger)',
                }}
                aria-hidden="true"
              />
            </TooltipTrigger>
            <TooltipContent>
              <div className="font-semibold">{p.cleanTitle}</div>
              <div className="opacity-l">{formatDate(p.date)} · {resultLabel[p.result]}</div>
            </TooltipContent>
          </Tooltip>
        ))}
      </a>
    </div>
  )
}
