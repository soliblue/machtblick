import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { PartyDetailData } from '@/server/party'
import { programmeStatusLabel } from '@/lib/programmeStatus'
import { CandidateCard } from '../candidates/CandidateCard'

type Props = {
  data: PartyDetailData
}

export function PartyDetail({ data }: Props) {
  return (
    <main
      className="mx-auto min-h-[calc(100svh-110px)] max-w-3xl px-l py-xl"
      style={{ '--party-color': `var(--color-${data.party.color})` } as CSSProperties}
    >
      <Link to="/parties/" className="inline-flex items-center gap-xs text-m opacity-l hover:opacity-100">
        <ArrowLeft size={17} /> Alle Parteien
      </Link>
      <header className="mt-xl">
        <div className="flex items-center gap-s text-s caption">
          <span className="size-[10px] rounded-full bg-[var(--party-color)]" />
          <span>{data.party.listType === 'landesliste' ? 'Landesliste' : 'Bezirkslisten'}</span>
        </div>
        <h1 className="mt-xs font-display text-xxl font-semibold">{data.party.shortName}</h1>
        <p className="mt-xs text-m opacity-l">{data.party.name}</p>
        <dl className="mt-l grid gap-s border-t border-fg/15 pt-m text-m">
          <div className="flex justify-between gap-l">
            <dt className="opacity-l">Geltungsbereich</dt>
            <dd className="text-right">{data.party.listScope}</dd>
          </div>
          <div className="flex justify-between gap-l">
            <dt className="opacity-l">Erfasste Kandidierende</dt>
            <dd>{data.candidates.length}</dd>
          </div>
        </dl>
      </header>
      <section className="mt-xl rounded-m bg-surface p-l">
        <div className="text-s caption opacity-l">Programm</div>
        <h2 className="mt-xs font-display text-xl font-semibold">
          {data.programme?.programme.title ?? programmeStatusLabel[data.party.programmeStatus]}
        </h2>
        <p className="mt-s font-prose text-l">
          {data.programme?.programme.summary ?? 'In den geprüften Quellen wurde noch kein belastbares Programm für die Berlin-Wahl 2026 gefunden.'}
        </p>
        {data.programme ? (
          <Link to="/programmes/$slug/" params={{ slug: data.party.slug }} className="mt-m inline-flex items-center gap-xs text-m font-semibold">
            {data.programme.topics.length} {data.programme.topics.length === 1 ? 'Thema' : 'Themen'} ansehen <ArrowRight size={14} />
          </Link>
        ) : null}
      </section>
      <section className="mt-xl">
        <div className="flex items-end justify-between gap-l">
          <div>
            <div className="text-s caption opacity-l">Menschen</div>
            <h2 className="mt-xs font-display text-xl font-semibold">Kandidierende</h2>
          </div>
          <span className="text-s caption opacity-l">{data.candidates.length} Profile</span>
        </div>
        {data.candidates.length ? (
          <div className="mt-l">
            {data.candidates.map((candidate) => (
              <CandidateCard
                key={candidate.slug}
                candidate={candidate}
              />
            ))}
          </div>
        ) : (
          <p className="mt-l rounded-m border border-fg/15 p-l text-m opacity-l">
            Eine verlässliche Kandidierendenübersicht wurde noch nicht veröffentlicht.
          </p>
        )}
      </section>
      {data.party.candidateUrl ? (
        <a href={data.party.candidateUrl} className="mt-xl inline-flex items-center gap-xs border-t border-fg/15 pt-l text-m opacity-l hover:opacity-100">
          Originale Kandidierendenübersicht <ExternalLink size={14} />
        </a>
      ) : null}
    </main>
  )
}
