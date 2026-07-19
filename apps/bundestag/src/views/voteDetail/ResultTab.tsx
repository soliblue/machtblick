import { useState } from 'react'
import type { VoteDetail as VoteDetailData } from '@/server/voteDetail'
import type { VoteChoice } from '@/views/votesList/VoteDistributionDonut'
import { VoteHemicycle } from '@/views/votesList/VoteHemicycle'
import { PartyDonutGrid } from './PartyDonutGrid'
import { useCopy } from '@/lib/i18n'

type Props = { data: VoteDetailData }

export function ResultTab({ data }: Props) {
  const { vote, partySummaries } = data
  const [filter, setFilter] = useState<VoteChoice | null>(null)
  const t = useCopy()
  const toggle = (c: VoteChoice) => setFilter((prev) => (prev === c ? null : c))
  return (
    <>
      <div className="mb-l rounded-m bg-surface p-m text-s">
        {t.officialDataNoticePrefix}{' '}
        <a href={vote.sourceUrl ?? undefined} target="_blank" rel="noreferrer" className="underline">
          {t.officialDataNoticeLink}
        </a>
        .
      </div>

      <section className="mb-l">
        <div className="flex justify-center">
          <VoteHemicycle
            yes={vote.yes}
            no={vote.no}
            abstain={vote.abstain}
            absent={vote.absent}
            totalMembers={vote.totalMembers}
            hero
            selected={filter}
            onSelect={toggle}
          />
        </div>
      </section>

      <section className="mb-l">
        <PartyDonutGrid summaries={partySummaries} selected={filter} />
      </section>
    </>
  )
}
