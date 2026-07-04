import { useState } from 'react'
import type { VoteDetail as VoteDetailData } from '@/server/voteDetail'
import type { VoteChoice } from '@/views/votesList/VoteDistributionDonut'
import { VoteHemicycle } from '@/views/votesList/VoteHemicycle'
import { PartyDonutGrid } from './PartyDonutGrid'
import { DefectorList } from './DefectorList'
import { useCopy } from '@/lib/i18n'

type Props = { data: VoteDetailData }

export function ResultTab({ data }: Props) {
  const { vote, partySummaries, defectors } = data
  const [filter, setFilter] = useState<VoteChoice | null>(null)
  const t = useCopy()
  const toggle = (c: VoteChoice) => setFilter((prev) => (prev === c ? null : c))
  return (
    <>
      <section className="mb-l">
        <div className="mb-s text-s caption opacity-l">{t.result}</div>
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
        <div className="mb-s text-s caption opacity-l">{t.navParties}</div>
        <PartyDonutGrid summaries={partySummaries} selected={filter} />
      </section>

      {defectors.length > 0 && (
        <section>
          <div className="mb-s text-s caption opacity-l">{t.deviations}</div>
          <DefectorList defectors={defectors} partySummaries={partySummaries} />
        </section>
      )}

      <p className="mt-xl text-s opacity-l">
        <a href={vote.sourceUrl ?? undefined} target="_blank" rel="noreferrer" className="underline">
          {t.officialSource} ↗
        </a>
      </p>
    </>
  )
}
