import type { BerlinCandidacy } from '@machtblick/berlin-db/types'

type Props = {
  candidacies: BerlinCandidacy[]
}

export function CandidateCandidacies({ candidacies }: Props) {
  return (
    <section
      className="col-span-2 grid gap-s desk:col-span-1 desk:col-start-2 desk:max-w-[360px]"
      style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(candidacies.length, 1), 2)}, minmax(0, 1fr))` }}
    >
      {candidacies.map((candidacy, index) => (
        <div key={`${candidacy.type}-${candidacy.district}-${candidacy.constituency}-${candidacy.listPosition}-${index}`} className="min-w-0 pt-m">
          <div className="text-s caption opacity-l">
            {candidacy.type === 'wahlkreis' ? 'Direktkandidatur' : candidacy.type === 'bezirksliste' ? 'Bezirksliste' : 'Landesliste'}
          </div>
          <div className="mt-xs font-display text-[32px] font-semibold leading-none tabular-nums">
            {candidacy.type === 'wahlkreis' ? `WK ${candidacy.constituency ?? '?'}` : `Platz ${candidacy.listPosition ?? '?'}`}
          </div>
          <p className="mt-s text-s opacity-l">{candidacy.district ?? 'Berlin'}</p>
        </div>
      ))}
    </section>
  )
}
