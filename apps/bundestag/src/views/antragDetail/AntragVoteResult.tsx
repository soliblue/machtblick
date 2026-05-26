import { useState } from 'react'
import type { AntragLinkedVote } from '@/server/antraege'
import { formatDate } from '@/lib/format'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'
import { VoteDistributionDonut, type VoteChoice } from '@/views/votesList/VoteDistributionDonut'
import { Stamp } from '@/views/votesList/Stamp'
import { deriveStamps } from '@/views/votesList/deriveStamps'
import { PartyWaffle } from '@/views/voteDetail/PartyWaffle'

type Props = {
  vote: AntragLinkedVote
}

export function AntragVoteResult({ vote }: Props) {
  const [filter, setFilter] = useState<VoteChoice | null>(null)
  const locale = useLocale()
  const t = useCopy()
  const stamps = deriveStamps(vote)
  const href = withLocale(`/votes/${vote.id}/`, locale)
  const toggle = (choice: VoteChoice) => setFilter((current) => (current === choice ? null : choice))
  return (
    <section className="border-t py-l" style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}>
      <a href={href} className="text-l font-semibold underline-offset-4 hover:underline">{vote.cleanTitle}</a>
      <div className="mt-s flex flex-wrap items-center gap-s text-s opacity-l">
        <span>{formatDate(vote.date)}</span>
        <span>{vote.voteType === 'namentlich' ? t.namedVote : vote.voteType === 'handzeichen' ? t.showOfHands : t.division}</span>
      </div>
      <div className="mt-m flex flex-wrap items-center gap-l">
        {stamps.map((stamp) => <Stamp key={stamp} variant={stamp} size="m" />)}
      </div>
      {vote.totalMembers > 0 && vote.partySummaries.length > 0 ? (
        <div className="mt-l grid items-start gap-l md:grid-cols-[auto_1fr] md:items-center">
          <div className="flex justify-center md:justify-start">
            <VoteDistributionDonut
              yes={vote.yes}
              no={vote.no}
              abstain={vote.abstain}
              absent={vote.absent}
              size={180}
              selected={filter}
              onSelect={toggle}
              showLabel
            />
          </div>
          <PartyWaffle summaries={vote.partySummaries} highlight={filter} memberBallots={vote.memberBallots} />
        </div>
      ) : null}
    </section>
  )
}
