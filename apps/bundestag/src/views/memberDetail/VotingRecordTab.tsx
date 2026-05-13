import { Filter, GitBranch, Vote } from 'lucide-react'
import { Link } from '../../lib/Link'
import type { MemberVoteRow } from '@/server/members'
import { formatDate } from '@/lib/format'
import { FilterPill } from '@/views/votesList/FilterPill'
import { Stamp } from '@/views/votesList/Stamp'
import { VoteChoicePill } from './VoteChoicePill'

const CHOICE_LABEL: Record<string, string> = {
  ja: 'Ja',
  nein: 'Nein',
  enthalten: 'Enthalten',
  nicht_abgegeben: '–',
}

const LINE_LABEL: Record<string, string> = {
  linie: 'Linie',
  abw: 'Abw',
}

type Props = {
  history: MemberVoteRow[]
  lineFilter: string | null
  setLineFilter: (v: string | null) => void
  choiceFilter: string | null
  setChoiceFilter: (v: string | null) => void
}

export function VotingRecordTab({ history, lineFilter, setLineFilter, choiceFilter, setChoiceFilter }: Props) {
  const filtered = history.filter((r) => {
    const lineOk = lineFilter ? (r.defected !== null && (lineFilter === 'abw' ? r.defected : !r.defected)) : true
    const choiceOk = choiceFilter ? r.choice === choiceFilter : true
    return lineOk && choiceOk
  })
  return (
    <div className="flex flex-col">
      <div className="mb-m flex flex-wrap items-center gap-s">
        <Filter size={14} className="opacity-l" />
        <FilterPill
          label="Linie"
          icon={GitBranch}
          options={['linie', 'abw']}
          value={lineFilter}
          onChange={setLineFilter}
          formatOption={(o) => LINE_LABEL[o] ?? o}
        />
        <FilterPill
          label="Stimme"
          icon={Vote}
          options={['ja', 'nein', 'enthalten', 'nicht_abgegeben']}
          value={choiceFilter}
          onChange={setChoiceFilter}
          formatOption={(o) => CHOICE_LABEL[o] ?? o}
        />
      </div>
      {filtered.map((r) => (
        <Link
          key={r.voteId}
          to="/votes/$id/"
          params={{ id: r.voteId }}
          className="flex flex-col border-t py-m transition-opacity hover:opacity-80"
          style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
        >
          <span className="text-m" style={{ overflowWrap: 'anywhere' }}>{r.title}</span>
          <div className="mt-s flex flex-wrap items-center justify-between gap-x-m gap-y-s">
            <span className="flex flex-wrap items-center gap-s text-s opacity-l">
              <span className="whitespace-nowrap">{formatDate(r.date)}</span>
              <Stamp variant={r.result} size="s" />
              {r.defected === true ? <Stamp variant="abweichler" size="s" /> : null}
            </span>
            <VoteChoicePill choice={r.choice} />
          </div>
        </Link>
      ))}
    </div>
  )
}
