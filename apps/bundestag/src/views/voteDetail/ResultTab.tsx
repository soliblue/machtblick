import { useState } from 'react'
import type { VoteDetail as VoteDetailData } from '@/server/votes'
import { VoteDistributionDonut, type VoteChoice } from '@/views/votesList/VoteDistributionDonut'
import { PartyWaffle } from './PartyWaffle'
import { VoteCountsRow } from './VoteCountsRow'
import { DefectorList } from './DefectorList'
import { useCopy, useLocale } from '@/lib/i18n'

type Props = { data: VoteDetailData }

export function ResultTab({ data }: Props) {
  const { vote, partySummaries, defectors, memberBallots } = data
  const [filter, setFilter] = useState<VoteChoice | null>(null)
  const t = useCopy()
  const locale = useLocale()
  const toggle = (c: VoteChoice) => setFilter((prev) => (prev === c ? null : c))
  return (
    <>
      <div className="mb-l bg-surface p-m text-s">
        {locale === 'de' ? (
          <>
            Diese Ergebnisdaten basieren auf der <a href={vote.sourceUrl} target="_blank" rel="noreferrer" className="underline">offiziellen Quelle des Deutschen Bundestages</a>.
          </>
        ) : (
          <>
            These results are based on the <a href={vote.sourceUrl} target="_blank" rel="noreferrer" className="underline">official source of the German Bundestag</a>.
          </>
        )}
      </div>

      <VoteCountsRow
        yes={vote.yes}
        no={vote.no}
        abstain={vote.abstain}
        absent={vote.absent}
        selected={filter}
        onSelect={toggle}
      />

      <section className="mb-l grid items-start gap-l md:grid-cols-[auto_1fr]">
        <div>
          <div className="mb-s text-s uppercase opacity-l">{t.result}</div>
          <div className="flex justify-center md:justify-start">
            <VoteDistributionDonut
              yes={vote.yes}
              no={vote.no}
              abstain={vote.abstain}
              absent={vote.absent}
              size={240}
              selected={filter}
              onSelect={toggle}
              showLabel
            />
          </div>
        </div>
        <div>
          <div className="mb-s text-s uppercase opacity-l">{t.navParties}</div>
          <PartyWaffle summaries={partySummaries} highlight={filter} memberBallots={memberBallots} />
        </div>
      </section>

      {defectors.length > 0 && (
        <section>
          <div className="mb-s text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>{t.deviations}</div>
          <DefectorList defectors={defectors} />
        </section>
      )}
    </>
  )
}
