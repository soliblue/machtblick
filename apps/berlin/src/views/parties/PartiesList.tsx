import type { PartyItem } from '@/server/catalog'
import { PartyCard } from './PartyCard'

type Props = {
  parties: PartyItem[]
  candidateCounts: Record<string, number>
  admissionSourceUrl: string
}

export function PartiesList({ parties, candidateCounts, admissionSourceUrl }: Props) {
  return (
    <main className="mx-auto min-h-[calc(100svh-110px)] max-w-3xl px-l py-xl">
      <div className="mb-l flex items-end justify-between gap-l">
        <div>
          <div className="text-s caption opacity-l">Abgeordnetenhauswahl 2026</div>
          <h1 className="mt-xs font-display text-xxl font-semibold">17 zugelassene Parteien</h1>
        </div>
        <a href={admissionSourceUrl} className="text-s underline underline-offset-2 opacity-l">Amtliche Zulassung</a>
      </div>
      <div className="grid gap-m desk:grid-cols-2">
        {parties.map((party) => <PartyCard key={party.slug} party={party} candidateCount={candidateCounts[party.slug] ?? 0} />)}
      </div>
    </main>
  )
}
