import { Filter, GitBranch, Vote } from 'lucide-react'
import { Link } from '../../lib/Link'
import type { MemberVoteRow } from '@/server/members'
import { formatDate } from '@/lib/format'
import { FilterPill } from '@/views/votesList/FilterPill'

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
      <div
        className="grid grid-cols-[1fr_auto_auto_auto] gap-m py-s text-s uppercase opacity-l"
        style={{ letterSpacing: '0.08em' }}
      >
        <span>Abstimmung</span>
        <span className="w-24">Datum</span>
        <span className="w-24">Stimme</span>
        <span className="w-16">Linie</span>
      </div>
      {filtered.map((r) => (
        <Link
          key={r.voteId}
          to="/votes/$id/"
          params={{ id: r.voteId }}
          className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-m border-t py-m text-m transition-opacity hover:opacity-80"
          style={{ borderColor: 'color-mix(in oklab, var(--color-fg) 15%, transparent)' }}
        >
          <span>{r.title}</span>
          <span className="w-24 text-s opacity-l">{formatDate(r.date)}</span>
          <span className="w-24">{CHOICE_LABEL[r.choice]}</span>
          <span className="w-16 text-s" style={{ color: r.defected ? 'var(--color-danger)' : undefined, opacity: r.defected ? 1 : 0.7 }}>
            {r.defected === null ? '–' : r.defected ? 'Abw' : 'Linie'}
          </span>
        </Link>
      ))}
    </div>
  )
}
