import type { ProgrammeCategory } from '@machtblick/berlin-db/types'
import type { ComparisonGroup } from '@/hooks/useProgrammeComparison'
import { programmeCategoryLabel } from '@/lib/programmeCategories'
import { ProgrammeTopicPicker } from '../programmes/ProgrammeTopicPicker'
import { ComparisonCard } from './ComparisonCard'

type Props = {
  category: ProgrammeCategory
  groups: ComparisonGroup[]
  missingParties: string[]
  onCategoryChange: (category: ProgrammeCategory) => void
}

export function ProgrammeComparison({ category, groups, missingParties, onCategoryChange }: Props) {
  return (
    <main className="mx-auto min-h-[calc(100svh-110px)] max-w-3xl px-l py-xl">
      <header className="max-w-[620px]">
        <div className="text-s caption opacity-l">Deine Zweitstimme</div>
        <h1 className="mt-xs font-display text-xxl font-semibold">Was sagen die Parteien zu {programmeCategoryLabel[category]}?</h1>
        <p className="mt-s font-prose text-l">
          Zusammenfassungen aus den veröffentlichten Programmen und Programmmaterialien. Gleiche Themen stehen direkt untereinander, Originale und vollständiger Kontext bleiben erreichbar.
        </p>
      </header>
      <ProgrammeTopicPicker value={category} onChange={onCategoryChange} />
      <div className="flex justify-end">
        <span className="text-s caption opacity-l">{groups.length} Parteien mit Material</span>
      </div>
      <div className="mt-m grid gap-m">
        {groups.map((group) => <ComparisonCard key={group.partySlug} group={group} />)}
      </div>
      {missingParties.length ? (
        <section className="mt-xl border-t border-fg/15 pt-l text-m">
          <h2 className="font-semibold">Keine eigene Rubrik in unserem Material</h2>
          <p className="mt-s opacity-l">
            {missingParties.join(', ')}. Das bedeutet nicht automatisch, dass diese Parteien keine Position zum Thema haben.
          </p>
        </section>
      ) : null}
    </main>
  )
}
