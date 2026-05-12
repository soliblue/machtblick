import { Filter, Users, Vote, Scale } from 'lucide-react'
import { Link } from '../../lib/Link'
import type { PartyDetail as PartyDetailData, PartyVote } from '@/server/parties'
import { PARTY_COLOR, PARTY_LABEL, PARTY_LOGO } from '@/lib/parties'
import { formatDate } from '@/lib/format'
import { FilterPill } from '@/views/votesList/FilterPill'
import { Stamp } from '@/views/votesList/Stamp'
import { PartyLogo } from '@/views/votesList/PartyLogo'
import { AlignmentList } from './AlignmentList'
import { DonationsBar } from './DonationsBar'
import { ProposalsBar } from './ProposalsBar'
import { StatPie } from './StatPie'

type Result = 'angenommen' | 'abgelehnt'
const RESULT_LABELS: Record<Result, string> = { angenommen: 'Akzeptiert', abgelehnt: 'Abgelehnt' }
const VOTE_LABELS: Record<PartyVote, string> = { yes: 'Ja', no: 'Nein', abstain: 'Enthalten', split: 'Geteilt' }
const VOTE_COLOR: Record<PartyVote, string> = {
  yes: 'var(--color-success)',
  no: 'var(--color-danger)',
  abstain: 'var(--color-fg)',
  split: 'var(--color-fg)',
}

type Props = {
  data: PartyDetailData
  result: Result | null
  onResultChange: (value: Result | null) => void
  partyVote: PartyVote | null
  onPartyVoteChange: (value: PartyVote | null) => void
}

export function PartyDetail({ data, result, onResultChange, partyVote, onPartyVoteChange }: Props) {
  const color = PARTY_COLOR[data.party] ?? 'var(--color-gray)'
  const votes = data.votes.filter((v) => (!result || v.result === result) && (!partyVote || v.partyVote === partyVote))
  return (
    <main className="mx-auto max-w-3xl p-l">
      <h1 className="flex items-center gap-m text-xxl font-semibold">
        {PARTY_LOGO[data.party] ? (
          <PartyLogo party={data.party} size={44} />
        ) : (
          <span className="inline-block size-6" style={{ background: color }} />
        )}
        {PARTY_LABEL[data.party] ?? data.party}
        <Link
          to="/members/"
          search={{ party: data.party }}
          className="ml-auto flex items-center gap-xs text-l font-regular opacity-l hover:opacity-100"
          aria-label={`${data.seats} Sitze`}
        >
          <Users size={19} />
          <span>{data.seats}</span>
        </Link>
      </h1>

      <div className="mt-xl grid gap-x-xl gap-y-l md:grid-cols-2">
        <div className="flex justify-around gap-l">
          <StatPie
            label="Geschlossenheit"
            value={data.cohesion}
            info="Anteil der Fraktion, der bei einer Abstimmung dieselbe Position einnimmt. Berechnet über alle Abstimmungen (namentlich, Handzeichen, Hammelsprung), bei denen eine Fraktionsabstimmung erfasst ist."
          />
          <StatPie
            label="Anwesenheit"
            value={data.attendance}
            info="Anteil der Fraktionsmitglieder, die bei einer Abstimmung anwesend waren. Berechnet über alle Abstimmungen, bei denen eine Fraktionsabstimmung erfasst ist."
          />
        </div>
        {data.alignments.length > 0 ? (
          <div>
            <div className="mb-s text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>Übereinstimmung</div>
            <AlignmentList alignments={data.alignments} party={data.party} />
          </div>
        ) : <div />}
        {data.proposals.length > 0 ? <ProposalsBar proposals={data.proposals} /> : <div />}
        {data.donations.length > 0 ? <DonationsBar donations={data.donations} totalEur={data.donationsTotalEur} /> : <div />}
      </div>

      <div className="mt-xl mb-s text-s uppercase opacity-l" style={{ letterSpacing: '0.08em' }}>Abstimmungen</div>
      <div className="mb-l flex flex-wrap items-center gap-s">
        <Filter size={14} className="opacity-l" />
        <FilterPill
          label="Fraktion stimmte"
          icon={Vote}
          options={['yes', 'no', 'abstain', 'split']}
          value={partyVote}
          onChange={(v) => onPartyVoteChange(v as PartyVote | null)}
          formatOption={(o) => VOTE_LABELS[o as PartyVote]}
        />
        <FilterPill
          label="Ergebnis"
          icon={Scale}
          options={['angenommen', 'abgelehnt']}
          value={result}
          onChange={(v) => onResultChange(v as Result | null)}
          formatOption={(o) => RESULT_LABELS[o as Result]}
        />
      </div>
      <div className="flex flex-col">
        {votes.map((v) => (
          <Link
            key={v.voteId}
            to="/votes/$id/"
            params={{ id: v.voteId }}
            className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-l border-t py-m text-m transition-opacity first:border-t-0 hover:opacity-80"
            style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
          >
            <div className="flex min-w-0 flex-col">
              <span style={{ overflowWrap: 'anywhere' }}>{v.title}</span>
              <span className="text-s opacity-l">{formatDate(v.date)}</span>
            </div>
            <VoteChip vote={v.partyVote} />
            <Stamp variant={v.result} />
          </Link>
        ))}
      </div>
    </main>
  )
}

function VoteChip({ vote }: { vote: PartyVote }) {
  const color = VOTE_COLOR[vote]
  return (
    <span
      className="px-s py-xs text-s font-semibold"
      style={{ background: `color-mix(in oklab, ${color} 18%, transparent)`, color }}
    >
      {VOTE_LABELS[vote]}
    </span>
  )
}

