import { Link } from '@tanstack/react-router'
import { ArrowLeft, FileText } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { ProgrammeDetailData } from '@/server/programmes'
import { programmeStatusLabel } from '@/lib/programmeStatus'
import { formatDate } from '@/lib/formatDate'
import { ProgrammeDocument } from './ProgrammeDocument'
import { ProgrammeTopic } from './ProgrammeTopic'
import { SourceList } from '../sources/SourceList'

type Props = {
  data: ProgrammeDetailData
}

export function ProgrammeDetail({ data }: Props) {
  return (
    <main
      className="mx-auto min-h-[calc(100svh-110px)] max-w-3xl px-l py-xl"
      style={{ '--party-color': `var(--color-${data.party.color})` } as CSSProperties}
    >
      <Link to="/programmes/" className="inline-flex items-center gap-xs text-m opacity-l hover:opacity-100">
        <ArrowLeft size={17} /> Alle Programme
      </Link>
      <header className="mt-xl">
        <Link to="/parties/$slug/" params={{ slug: data.party.slug }} className="inline-flex items-center gap-s text-s caption">
          <span className="size-[10px] rounded-full bg-[var(--party-color)]" />
          <span>{data.party.shortName}</span>
        </Link>
        <h1 className="mt-xs font-display text-xxl font-semibold">{data.programme.title}</h1>
        <p className="mt-xs text-m opacity-l">
          {programmeStatusLabel[data.programme.status]}
          {data.programme.publicationDate ? `, veröffentlicht ${formatDate(data.programme.publicationDate)}` : ''}
        </p>
        <p className="mt-l font-prose text-l">{data.programme.summary}</p>
      </header>
      {data.topics.length ? (
        <>
          <nav aria-label="Themen im Programm" className="mt-xl flex flex-wrap gap-s">
            {data.topics.map((topic) => (
              <a key={topic.slug} href={`#${topic.slug}`} className="rounded-full border border-fg/15 px-m py-s text-s hover:bg-surface">
                {topic.title}
              </a>
            ))}
            {data.documents.length ? (
              <a href="#originaldokumente" className="inline-flex items-center gap-xs rounded-full border border-fg/15 px-m py-s text-s hover:bg-surface">
                <FileText size={14} /> {data.documents.length} {data.documents.length === 1 ? 'Original' : 'Originale'}
              </a>
            ) : null}
          </nav>
          <div className="mt-xl">
            {data.topics.map((topic, index) => <ProgrammeTopic key={topic.slug} topic={topic} number={index + 1} />)}
          </div>
        </>
      ) : (
        <section className="mt-xl rounded-m bg-surface p-l">
          <h2 className="font-display text-xl font-semibold">Noch keine Positionen aufbereitet</h2>
          <p className="mt-s text-m opacity-l">Wir haben in den geprüften Quellen noch kein aktuelles, belastbares Wahlprogramm gefunden.</p>
        </section>
      )}
      {data.documents.length ? (
        <section id="originaldokumente" className="scroll-mt-[78px] border-t border-fg/15 pt-xl">
          <div className="text-s caption opacity-l">Originaldokumente</div>
          <h2 className="mt-xs font-display text-xl font-semibold">Programme und Broschüren</h2>
          <p className="mt-s text-m opacity-l">Machtblick zeigt eine Vorschau, wenn der Herausgeber das Einbetten erlaubt. Das Original bleibt immer erreichbar.</p>
          <div className="mt-l grid gap-s">
            {data.documents.map((document) => <ProgrammeDocument key={document.id} document={document} />)}
          </div>
        </section>
      ) : null}
      <div className="mt-xl">
        <SourceList sources={data.sources} label="Originale und Belege" />
      </div>
    </main>
  )
}
