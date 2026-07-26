import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { PartyItem } from '@/server/catalog'
import { programmeStatusLabel } from '@/lib/programmeStatus'

type Props = {
  party: PartyItem
  candidateCount: number
}

const coverage = {
  complete_list: 'Liste veröffentlicht',
  district_hub: 'Bezirksseiten veröffentlicht',
  partial: 'Teilweise veröffentlicht',
  fragmented: 'Über Bezirke verteilt',
  missing: 'Noch keine Übersicht'
} as const

export function PartyCard({ party, candidateCount }: Props) {
  return (
    <Link
      to="/parties/$slug/"
      params={{ slug: party.slug }}
      className="group rounded-m border border-fg/15 bg-background p-l hover:bg-surface"
      style={{ '--party-color': `var(--color-${party.color})` } as CSSProperties}
    >
      <div className="flex items-center justify-between gap-l">
        <div className="flex items-center gap-s text-s caption">
          <span className="size-[10px] rounded-full bg-[var(--party-color)]" />
          <span>{party.listType === 'landesliste' ? 'Landesliste' : 'Bezirkslisten'}</span>
        </div>
        <ArrowRight size={17} className="transition-transform group-hover:translate-x-xs" />
      </div>
      <h2 className="mt-s font-display text-xl font-semibold">{party.shortName}</h2>
      <p className="mt-xs text-m opacity-l">{party.name}</p>
      <dl className="mt-l grid gap-s border-t border-fg/15 pt-m text-m">
        <div className="flex justify-between gap-l">
          <dt className="opacity-l">Kandidierende</dt>
          <dd>{candidateCount || coverage[party.candidateCoverage]}</dd>
        </div>
        <div className="flex justify-between gap-l">
          <dt className="opacity-l">Programm</dt>
          <dd className="text-right">{programmeStatusLabel[party.programmeStatus]}</dd>
        </div>
      </dl>
    </Link>
  )
}
