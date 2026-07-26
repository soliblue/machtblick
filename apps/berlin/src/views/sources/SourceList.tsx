import { ChevronDown, ExternalLink } from 'lucide-react'
import type { BerlinSource } from '@machtblick/berlin-db/types'
import { formatDate } from '@/lib/formatDate'

type Props = {
  sources: BerlinSource[]
  label?: string
  divided?: boolean
}

export function SourceList({ sources, label = 'Quellen und Stand', divided = true }: Props) {
  return (
    <details className={divided ? 'group border-t border-fg/15 pt-l' : 'group'}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-l text-m font-semibold">
        <span>{label}</span>
        <span className="flex items-center gap-xs text-s caption opacity-l">
          {sources.length} {sources.length === 1 ? 'Quelle' : 'Quellen'}
          <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <div className="mt-m grid gap-s">
        {sources.map((source) => (
          <a
            key={source.id}
            href={source.url}
            className="flex items-start justify-between gap-l rounded-m bg-surface p-m text-m hover:bg-elevated"
          >
            <span>
              <span className="block font-semibold">{source.title}</span>
              <span className="mt-xs block text-s opacity-l">
                {source.publisher}
                {source.publicationDate ? `, veröffentlicht ${formatDate(source.publicationDate)}` : ''}
                {`, abgerufen ${formatDate(source.retrievedAt)}`}
              </span>
            </span>
            <ExternalLink size={14} className="mt-xs shrink-0" />
          </a>
        ))}
      </div>
    </details>
  )
}
