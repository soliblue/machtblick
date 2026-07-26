import { Link } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import type { CandidateItem } from '@/server/catalog'
import { CandidatePortrait } from '../candidateDetail/CandidatePortrait'

type Props = {
  candidate: CandidateItem
  selectedDistrict?: string | null
  selectedConstituency?: number | null
}

export function CandidateCard({ candidate, selectedDistrict = null, selectedConstituency = null }: Props) {
  const direct = candidate.constituencies.find(({ district, number }) =>
    (!selectedDistrict || district === selectedDistrict)
    && (!selectedConstituency || number === selectedConstituency)) ?? candidate.constituencies[0]
  const list = candidate.candidacies.find(({ type }) => type !== 'wahlkreis')
  return (
    <article
      className="candidate-card group relative bg-background p-l desk:grid desk:grid-cols-[minmax(0,1fr)_250px] desk:gap-xl"
      style={{ '--party-color': `var(--color-${candidate.partyColor})` } as CSSProperties}
    >
      <Link
        to="/candidates/$slug/"
        params={{ slug: candidate.slug }}
        className="absolute inset-0 z-10"
        aria-label={`${candidate.name}, ${candidate.partyShortName}, ${direct ? `${direct.district}, Wahlkreis ${direct.number}` : 'Listenkandidatur'}`}
      />
      <div className="min-w-0">
        <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-m">
          <CandidatePortrait name={candidate.name} imageUrl={candidate.portraitUrl} variant="card" />
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-s text-s caption">
              <span className="flex shrink-0 items-center gap-s">
                <span className="size-[9px] shrink-0 rounded-full bg-[var(--party-color)]" />
                <span>{candidate.partyShortName}</span>
              </span>
              <span className="min-w-0 truncate text-right opacity-l">
                {direct
                  ? `WK ${direct.number} · ${direct.district}`
                  : list?.type === 'bezirksliste'
                    ? `${list.district} · Liste ${list.listPosition}`
                    : `Berlin · Liste ${list?.listPosition ?? 'offen'}`}
              </span>
            </div>
            <h2 className="mt-s font-display text-xl font-semibold leading-[1.15] decoration-1 underline-offset-[3px] group-hover:underline">
              {candidate.name}
            </h2>
            {candidate.occupation ? <p className="mt-xs text-m opacity-l">{candidate.occupation}</p> : null}
          </div>
        </div>
        <div className="mt-m">
          <div className="text-s caption opacity-l">Persönlich genannt</div>
          {candidate.priorities.length ? (
            <>
              <ul className="mt-s grid gap-xs font-prose text-m leading-[1.45]">
                {candidate.priorities.slice(0, 3).map((priority) => (
                  <li key={priority} className="flex gap-s">
                    <span aria-hidden="true" className="text-[var(--party-color)]">●</span>
                    <span>{priority}</span>
                  </li>
                ))}
              </ul>
              {candidate.priorities.length > 3 ? (
                <p className="mt-xs text-s opacity-l">+ {candidate.priorities.length - 3} weitere</p>
              ) : null}
            </>
          ) : (
            <p className="mt-s font-prose text-m opacity-l">Noch keine persönlichen Schwerpunkte in den geprüften Profilen.</p>
          )}
        </div>
      </div>
      <div className="mt-m flex items-center gap-l border-t border-fg/15 pt-m text-s desk:mt-0 desk:grid desk:grid-cols-2 desk:items-center desk:border-l desk:border-t-0 desk:pl-l desk:pt-0">
        <div>
          <div className="caption opacity-l">Erststimme</div>
          <div className="mt-xs font-display text-xl font-semibold leading-none text-[var(--party-color)] desk:text-[40px]">
            {direct ? `WK ${direct.number}` : 'Ohne'}
          </div>
          <div className="mt-xs hidden opacity-l desk:block">{direct?.district ?? 'Nicht erfasst'}</div>
        </div>
        <div>
          <div className="caption opacity-l">Liste</div>
          <div className="mt-xs font-display text-xl font-semibold leading-none desk:text-[40px]">{list?.listPosition ?? 'Ohne'}</div>
          <div className="mt-xs hidden opacity-l desk:block">
            {list?.type === 'bezirksliste' ? `Bezirk ${list.district ?? ''}` : list ? 'Landesliste' : 'Nicht erfasst'}
          </div>
        </div>
      </div>
    </article>
  )
}
