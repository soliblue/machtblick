import { Link } from '@tanstack/react-router'
import { ArrowRight, FileText } from 'lucide-react'
import type { BerlinProgrammeDocument } from '@machtblick/berlin-db/types'
import { documentKindLabel } from '@/lib/documentKind'
import { formatDate } from '@/lib/formatDate'

type Props = {
  document: BerlinProgrammeDocument
}

export function ProgrammeDocument({ document }: Props) {
  return (
    <Link
      to="/documents/$id/"
      params={{ id: document.id }}
      className="group flex items-start justify-between gap-l rounded-m border border-fg/15 p-m hover:bg-surface"
    >
      <span className="flex min-w-0 gap-m">
        <span className="flex size-[36px] shrink-0 items-center justify-center rounded-s bg-surface">
          <FileText size={17} />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-l font-semibold">{document.title}</span>
          <span className="mt-xs block text-s opacity-l">
            {documentKindLabel[document.kind] ?? 'Dokument'}, {document.format.toUpperCase()}
            {document.publicationDate ? `, ${formatDate(document.publicationDate)}` : ''}
            {document.format.toLowerCase() === 'pdf' ? document.embeddable ? ', Vorschau in Machtblick' : ', Original beim Herausgeber' : ''}
          </span>
        </span>
      </span>
      <ArrowRight size={17} className="mt-s shrink-0 transition-transform group-hover:translate-x-xs" />
    </Link>
  )
}
