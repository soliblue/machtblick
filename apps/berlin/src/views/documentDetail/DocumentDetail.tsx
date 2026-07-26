import { Link } from '@tanstack/react-router'
import { ArrowLeft, ExternalLink, FileText } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { DocumentDetailData } from '@/server/document'
import { documentKindLabel } from '@/lib/documentKind'
import { formatDate } from '@/lib/formatDate'
import { SourceList } from '../sources/SourceList'

type Props = {
  data: DocumentDetailData
}

export function DocumentDetail({ data }: Props) {
  return (
    <main
      className="mx-auto min-h-[calc(100svh-110px)] max-w-5xl px-l py-xl"
      style={{ '--party-color': `var(--color-${data.party.color})` } as CSSProperties}
    >
      <Link to="/programmes/$slug/" params={{ slug: data.party.slug }} className="inline-flex items-center gap-xs text-m opacity-l hover:opacity-100">
        <ArrowLeft size={17} /> Zurück zum Programm
      </Link>
      <header className="mt-xl max-w-3xl">
        <div className="flex items-center gap-s text-s caption">
          <span className="size-[10px] rounded-full bg-[var(--party-color)]" />
          <span>{data.party.shortName}, {documentKindLabel[data.document.kind] ?? 'Dokument'}</span>
        </div>
        <h1 className="mt-xs font-display text-xxl font-semibold">{data.document.title}</h1>
        <p className="mt-s text-m opacity-l">
          {data.document.publisher}
          {data.document.publicationDate ? `, veröffentlicht ${formatDate(data.document.publicationDate)}` : ''}
        </p>
        <p className="mt-l font-prose text-l">{data.programme.summary}</p>
        <a href={data.document.url} className="mt-m inline-flex items-center gap-xs rounded-m border border-fg/15 px-m py-s text-m font-semibold hover:bg-surface">
          Original öffnen <ExternalLink size={14} />
        </a>
        {data.document.format.toLowerCase() === 'pdf' && data.document.embeddable ? (
          <p className="mt-s text-s opacity-l">Die Vorschau lädt das Original direkt von {data.document.publisher}.</p>
        ) : null}
      </header>
      {data.document.format.toLowerCase() === 'pdf' && data.document.embeddable ? (
        <section className="mt-xl overflow-hidden rounded-m border border-fg/15 bg-surface">
          <div className="flex items-center gap-s border-b border-fg/15 px-m py-s text-s caption opacity-l">
            <FileText size={14} /> Dokumentansicht
          </div>
          <iframe
            src={data.document.url}
            title={data.document.title}
            className="h-[72svh] min-h-[560px] w-full bg-white"
          />
        </section>
      ) : null}
      {data.document.format.toLowerCase() === 'pdf' && !data.document.embeddable ? (
        <section className="mt-xl rounded-m bg-surface p-l text-m">
          {data.document.publisher} verhindert die Einbettung dieses PDFs auf anderen Webseiten. Das geprüfte Original öffnet über den Button oben.
        </section>
      ) : null}
      {data.document.format.toLowerCase() !== 'pdf' ? (
        <section className="mt-xl rounded-m bg-surface p-l text-m">
          Diese Quelle ist eine Webseite. Der aufbereitete Inhalt steht im Programmprofil, das Original öffnet über den Button oben.
        </section>
      ) : null}
      <div className="mt-xl max-w-3xl">
        <SourceList sources={data.sources} />
      </div>
    </main>
  )
}
