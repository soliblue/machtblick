import type { MpPartySummary } from '@/server/mpVotes'
import { VoteDistributionDonut } from '@/views/votesList/VoteDistributionDonut'

type Props = { partySummaries: MpPartySummary[] }

const jaShare = (s: MpPartySummary) => {
  const decided = s.yes + s.no + s.abstain
  return decided ? s.yes / decided : 0
}

export function MpDonutRow({ partySummaries }: Props) {
  const sorted = [...partySummaries].sort((a, b) => jaShare(b) - jaShare(a))
  const size = sorted.length > 6 ? 40 : 52
  return (
    <div className="flex w-full flex-wrap items-start justify-center gap-x-s gap-y-m">
      {sorted.map((p) => (
        <div key={p.party} className="flex w-[52px] min-w-0 flex-col items-center gap-xs">
          <VoteDistributionDonut yes={p.yes} no={p.no} abstain={p.abstain} absent={p.absent} size={size} />
          <span
            className={`max-w-full truncate text-[9px] uppercase ${p.position === 'mixed' ? 'font-semibold' : 'opacity-l'}`}
            style={{ letterSpacing: '0.06em' }}
          >
            {p.label}
          </span>
        </div>
      ))}
    </div>
  )
}
