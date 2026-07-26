import { ExternalLink } from 'lucide-react'
import type { BerlinCandidateLink } from '@machtblick/berlin-db/types'

type Props = {
  links: BerlinCandidateLink[]
}

export function CandidateLinks({ links }: Props) {
  return links.length ? (
    <section className="mt-xl pt-l">
      <div className="text-s caption opacity-l">Öffentliche Profile und Kontakt</div>
      <div className="mt-m flex flex-wrap gap-s">
        {links.map((link) => (
          <a key={`${link.kind}-${link.url}`} href={link.url} className="inline-flex items-center gap-xs rounded-m border border-fg/15 px-m py-s text-m font-semibold hover:bg-surface">
            {link.label} <ExternalLink size={14} />
          </a>
        ))}
      </div>
    </section>
  ) : null
}
