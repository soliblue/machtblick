import { Link } from '../../lib/Link'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { PartyProposal } from '@/server/parties'
import { formatDate } from '@/lib/format'

type Props = { proposals: PartyProposal[] }

export function ProposalsBar({ proposals }: Props) {
  const total = proposals.length
  const accepted = proposals.filter((p) => p.result === 'angenommen').length
  return (
    <div className="mt-xl">
      <div className="flex items-center justify-between text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>
        <span>Anträge</span>
        <span>{accepted} / {total} angenommen</span>
      </div>
      <div className="mt-s flex h-8 w-full gap-[2px] overflow-hidden">
        {proposals.map((p) => (
          <Tooltip key={p.voteId}>
            <TooltipTrigger asChild>
              <Link
                to="/votes/$id/"
                params={{ id: p.voteId }}
                className="flex-1 transition-opacity hover:opacity-70"
                style={{
                  background: p.result === 'angenommen' ? 'var(--color-success)' : 'var(--color-danger)',
                }}
                aria-label={`${p.title} · ${p.result}`}
              />
            </TooltipTrigger>
            <TooltipContent>
              <div className="font-semibold">{p.title}</div>
              <div className="opacity-l">{formatDate(p.date)} · {p.result}</div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
