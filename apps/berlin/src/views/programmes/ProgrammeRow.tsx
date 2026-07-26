import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { ProgrammeItem } from '@/server/programmes'
import { programmeStatusLabel } from '@/lib/programmeStatus'

type Props = {
  programme: ProgrammeItem
}

export function ProgrammeRow({ programme }: Props) {
  return (
    <Link
      to="/programmes/$slug/"
      params={{ slug: programme.partySlug }}
      className="group block border-t border-fg/15 py-l"
      style={{ '--party-color': `var(--color-${programme.partyColor})` } as CSSProperties}
    >
      <div className="flex items-start justify-between gap-l">
        <div className="min-w-0">
          <div className="flex items-center gap-s text-s caption">
            <span className="size-[10px] rounded-full bg-[var(--party-color)]" />
            <span>{programmeStatusLabel[programme.status]}</span>
          </div>
          <h2 className="mt-xs font-display text-xl font-semibold">{programme.partyShortName}</h2>
          <p className="mt-s font-prose text-l">{programme.summary}</p>
          <p className="mt-m text-s opacity-l">
            {programme.topicCount} {programme.topicCount === 1 ? 'Thema aufbereitet' : 'Themen aufbereitet'}
            {programme.documentCount ? `, ${programme.documentCount} ${programme.documentCount === 1 ? 'Originaldokument' : 'Originaldokumente'}` : ''}
          </p>
        </div>
        <ArrowRight size={17} className="mt-xs shrink-0 transition-transform group-hover:translate-x-xs" />
      </div>
    </Link>
  )
}
