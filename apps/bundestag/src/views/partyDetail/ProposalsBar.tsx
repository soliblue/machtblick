import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { PartyProposal } from '@/server/parties'
import { formatDate } from '@/lib/format'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'

type Props = { proposals: PartyProposal[] }

export function ProposalsBar({ proposals }: Props) {
  const total = proposals.length
  const accepted = proposals.filter((p) => p.result === 'angenommen').length
  const locale = useLocale()
  const t = useCopy()
  const resultLabel = { angenommen: t.accepted, abgelehnt: t.rejected }
  return (
    <div className="mt-xl">
      <div className="flex items-center justify-between text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>
        <span>{t.proposals}</span>
        <span>{accepted} / {total} {t.acceptedCount}</span>
      </div>
      <div className="mt-s flex h-8 w-full gap-[2px] overflow-hidden">
        {proposals.map((p) => (
          <Tooltip key={p.voteId}>
            <TooltipTrigger asChild>
              <a
                href={withLocale(`/votes/${p.voteId}/`, locale)}
                className="flex-1 transition-opacity hover:opacity-70"
                style={{
                  background: p.result === 'angenommen' ? 'var(--color-success)' : 'var(--color-danger)',
                }}
                aria-label={`${p.cleanTitle ?? p.title} · ${resultLabel[p.result]}`}
              />
            </TooltipTrigger>
            <TooltipContent>
              <div className="font-semibold">{p.cleanTitle ?? p.title}</div>
              <div className="opacity-l">{formatDate(p.date)} · {resultLabel[p.result]}</div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
