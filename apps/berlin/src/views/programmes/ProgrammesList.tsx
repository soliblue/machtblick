import type { ProgrammeItem } from '@/server/programmes'
import { programmeStatusRank } from '@/lib/programmeStatus'
import { ProgrammeRow } from './ProgrammeRow'

type Props = {
  programmes: ProgrammeItem[]
}

export function ProgrammesList({ programmes }: Props) {
  return (
    <main className="mx-auto min-h-[calc(100svh-110px)] max-w-3xl px-l py-xl">
      <section className="mb-xl max-w-[600px]">
        <div className="text-s caption opacity-l">Berlin-Wahl 2026</div>
        <h1 className="mt-xs font-display text-xxl font-semibold">Was die Parteien vorhaben</h1>
        <p className="mt-s font-prose text-l">
          Wahlprogramme, Entwürfe und aktuelles Material, nach Themen aufbereitet und direkt hier lesbar. Originaldokumente bleiben als Belege erhalten.
        </p>
        <Link to="/compare/" search={{ topic: undefined }} className="mt-m inline-flex items-center gap-xs rounded-m border border-fg/15 px-m py-s text-m font-semibold hover:bg-surface">
          Nach Themen vergleichen <ArrowRight size={14} />
        </Link>
      </section>
      <div>
        {[...programmes]
          .sort((a, b) => programmeStatusRank[a.status] - programmeStatusRank[b.status] || a.partyShortName.localeCompare(b.partyShortName, 'de'))
          .map((programme) => <ProgrammeRow key={programme.partySlug} programme={programme} />)}
      </div>
    </main>
  )
}
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
