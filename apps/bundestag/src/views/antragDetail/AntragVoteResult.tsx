import { useState } from 'react'
import type { AntragLinkedVote } from '@/server/antraege'
import { formatDateShort } from '@/lib/format'
import { useCopy, useLocale } from '@/lib/i18n'
import { withLocale } from '@/lib/locale'
import type { VoteChoice } from '@/views/votesList/VoteDistributionDonut'
import { VoteHemicycle } from '@/views/votesList/VoteHemicycle'
import { deriveStamps } from '@/views/votesList/deriveStamps'
import { PartyDonutGrid } from '@/views/voteDetail/PartyDonutGrid'

type Props = {
  vote: AntragLinkedVote
}

export function AntragVoteResult({ vote }: Props) {
  const [filter, setFilter] = useState<VoteChoice | null>(null)
  const locale = useLocale()
  const t = useCopy()
  const accepted = vote.result === 'angenommen'
  const kickerStamps = deriveStamps(vote).slice(1)
  const toggle = (choice: VoteChoice) => setFilter((current) => (current === choice ? null : choice))
  return (
    <section
      aria-label={[vote.cleanTitle, accepted ? t.accepted : t.rejected, `${t.yes} ${vote.yes}`, `${t.no} ${vote.no}`, `${t.abstention} ${vote.abstain}`].join(' · ')}
      className="relative mb-m overflow-hidden rounded-m border border-fg/15 bg-background p-l"
      style={{ borderTop: `3px solid ${accepted ? 'var(--color-success)' : 'var(--color-danger)'}` }}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-[1] flex h-[22px] -translate-x-1/2 -translate-y-1/2 items-center justify-center px-xl text-[11px] font-semibold uppercase leading-none text-white"
        style={{ letterSpacing: '0.14em', textIndent: '0.14em', background: accepted ? 'var(--color-success)' : 'var(--color-danger)' }}
      >
        {accepted ? t.accepted : t.rejected}
      </div>
      <div className="mt-s flex flex-wrap items-center gap-s">
        <span className="text-s caption opacity-l">
          {formatDateShort(vote.date, locale)} · {vote.voteType === 'namentlich' ? t.namedVote : vote.voteType === 'handzeichen' ? t.showOfHands : t.division}
        </span>
        <span className="ml-auto flex flex-wrap gap-s">
          {kickerStamps.map((stamp) => (
            <span
              key={stamp}
              className="inline-flex h-[20px] items-center rounded-m border border-fg/40 px-s text-[11px] font-semibold uppercase leading-none"
              style={{ letterSpacing: '0.14em' }}
            >
              {t.stampClose[stamp]}
            </span>
          ))}
        </span>
      </div>
      <a href={withLocale(`/votes/${vote.id}/`, locale)} className="mt-m block text-l font-semibold underline-offset-4 hover:underline">
        {vote.cleanTitle}
      </a>
      {vote.totalMembers > 0 && (
        <div className="mt-l flex justify-center">
          <VoteHemicycle
            yes={vote.yes}
            no={vote.no}
            abstain={vote.abstain}
            absent={vote.voteType === 'namentlich' ? vote.absent : null}
            totalMembers={vote.totalMembers}
            selected={filter}
            onSelect={toggle}
          />
        </div>
      )}
      {vote.partySummaries.length > 0 && (
        <div className="mt-l">
          <PartyDonutGrid summaries={vote.partySummaries} selected={filter} />
        </div>
      )}
    </section>
  )
}
