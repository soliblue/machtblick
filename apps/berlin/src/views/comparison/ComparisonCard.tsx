import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { ComparisonGroup } from '@/hooks/useProgrammeComparison'
import { programmeStatusLabel } from '@/lib/programmeStatus'

type Props = {
  group: ComparisonGroup
}

export function ComparisonCard({ group }: Props) {
  return (
    <article
      className="comparison-card border-t border-fg/15 py-xl first:border-t-0"
      style={{ '--party-color': `var(--color-${group.partyColor})` } as CSSProperties}
    >
      <header>
        <div className="flex items-center gap-s text-s caption">
          <span className="size-[10px] rounded-full bg-[var(--party-color)]" />
          <span>{programmeStatusLabel[group.programmeStatus]}</span>
        </div>
        <h2 className="mt-xs font-display text-xl font-semibold">{group.partyShortName}</h2>
        <p className="mt-xs text-s opacity-l">{group.programmeTitle}</p>
      </header>
      {group.topics.map((topic) => (
        <section key={topic.slug} className="mt-l border-t border-fg/15 pt-l">
          <h3 className="font-display text-l font-semibold">{topic.title}</h3>
          <p className="mt-s font-prose text-l">{topic.summary}</p>
          <ul className="mt-m grid gap-s">
            {topic.positions.map((position) => (
              <li key={position} className="flex gap-s text-m">
                <span aria-hidden="true" className="text-[var(--party-color)]">●</span>
                <span>{position}</span>
              </li>
            ))}
          </ul>
          <Link
            to="/programmes/$slug/"
            params={{ slug: group.partySlug }}
            hash={topic.slug}
            className="mt-m inline-flex items-center gap-xs text-m font-semibold"
          >
            Im Programm einordnen <ArrowRight size={14} />
          </Link>
        </section>
      ))}
    </article>
  )
}
