import type { AntragLinkedVote } from '@/server/antraege'
import { formatDateShort } from '@/lib/format'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'
import { useVoteResultTable } from '@/hooks/useVoteResultTable'
import { VoteResultTable } from '@/views/voteDetail/VoteResultTable'
import { deriveStamps } from '@/views/votesList/deriveStamps'
import { KickerChip } from '@/components/KickerChip'
import { Stamp } from '@/views/votesList/Stamp'

type Props = {
  vote: AntragLinkedVote
}

export function AntragVoteResult({ vote }: Props) {
  const locale = useLocale()
  const t = useCopy()
  const accepted = vote.result === 'angenommen'
  const kickerStamps = deriveStamps(vote).slice(1)
  return (
    <section
      aria-label={[vote.cleanTitle, accepted ? t.accepted : t.rejected, `${t.yes} ${vote.yes}`, `${t.no} ${vote.no}`, `${t.abstention} ${vote.abstain}`].join(' · ')}
    >
      <div className="mb-l flex items-start gap-m rounded-m bg-surface p-m">
        <a href={withLocale(`/votes/${vote.id}/`, locale)} className="min-w-0 flex-1 underline-offset-4 hover:underline">
          <span className="block text-s caption opacity-l">
            {formatDateShort(vote.date, locale)} · {vote.voteType === 'namentlich' ? t.namedVote : vote.voteType === 'handzeichen' ? t.showOfHands : t.division}
          </span>
          <span className="mt-xs block text-m font-semibold">{vote.cleanTitle}</span>
          {kickerStamps.length > 0 ? (
            <span className="mt-s flex flex-wrap gap-s">
              {kickerStamps.map((stamp) => <KickerChip key={stamp}>{t.stampClose[stamp]}</KickerChip>)}
            </span>
          ) : null}
        </a>
        <Stamp variant={vote.result} rotated={false} />
      </div>
      <VoteResultTable {...useVoteResultTable({ vote, partySummaries: vote.partySummaries })} />
    </section>
  )
}
