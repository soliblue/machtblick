import { useState } from 'react'
import type { VoteDetail as VoteDetailData } from '@/server/votes'
import { formatDate } from '@/lib/format'
import { PartyBadge } from '@/views/votesList/PartyBadge'
import { Stamp } from '@/views/votesList/Stamp'
import { deriveStamps } from '@/views/votesList/deriveStamps'
import { VoteTitle } from '@/views/votesList/VoteTitle'
import { VoteDistributionDonut, type VoteChoice } from '@/views/votesList/VoteDistributionDonut'
import { PartyWaffle } from './PartyWaffle'
import { DebateList } from './DebateList'
import { DefectorList } from './DefectorList'

type Props = { data: VoteDetailData }

export function VoteDetail({ data }: Props) {
  const { vote, documents, partySummaries, proposingParty, defectors, memberBallots } = data
  const stamps = deriveStamps({ ...vote, partySummaries })
  const [filter, setFilter] = useState<VoteChoice | null>(null)
  const toggle = (c: VoteChoice) => setFilter((prev) => (prev === c ? null : c))
  return (
    <main className="mx-auto max-w-3xl p-l">
      <VoteTitle title={vote.title} as="h1" className="text-xxl font-semibold" style={{}} iconSize={18} />
      <div className="mt-s flex items-center gap-m text-m">
        <PartyBadge party={proposingParty} />
        <span className="opacity-l">{formatDate(vote.date)}</span>
        {vote.topic && <span className="opacity-l">· {vote.topic}</span>}
      </div>
      <div className="mt-m mb-l flex flex-wrap items-center gap-l">
        {stamps.map((s) => (
          <Stamp key={s} variant={s} size="m" />
        ))}
      </div>

      {vote.summary && <p className="mb-l text-m">{vote.summary}</p>}

      <section className="mb-l grid items-start gap-l md:grid-cols-[auto_1fr] md:items-center">
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
        <PartyWaffle summaries={partySummaries} highlight={filter} memberBallots={memberBallots} />
      </section>

      {data.debate.length > 0 && <DebateList speeches={data.debate} />}

      {defectors.length > 0 && (
        <section className="mb-l">
          <div className="mb-s text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>Abweichler</div>
          <DefectorList defectors={defectors} />
        </section>
      )}

      {documents.length > 0 && (
        <section>
          <div className="mb-s text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>Dokumente</div>
          <div className="flex flex-col gap-s">
            {documents.map((d) => (
              <a
                key={d.id}
                href={d.url}
                target="_blank"
                rel="noreferrer"
                className="text-m hover:underline"
              >
                {d.label} – {d.title}
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
