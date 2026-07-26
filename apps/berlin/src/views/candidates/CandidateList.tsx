import { Filter, Search } from 'lucide-react'
import { FilterPill } from '@machtblick/web-ui'
import type { CandidateItem } from '@/server/catalog'
import { CandidateCard } from './CandidateCard'
import { CandidateFilterSheet } from './CandidateFilterSheet'

type Props = {
  candidates: CandidateItem[]
  parties: { value: string; label: string }[]
  districts: string[]
  constituencies: number[]
  query: string
  party: string | null
  district: string | null
  constituency: number | null
  personalOnly: boolean
  onQueryChange: (query: string) => void
  onPartyChange: (party: string | null) => void
  onDistrictChange: (district: string | null) => void
  onConstituencyChange: (constituency: number | null) => void
  onPersonalOnlyChange: (personalOnly: boolean) => void
  onReset: () => void
}

export function CandidateList({
  candidates,
  parties,
  districts,
  constituencies,
  query,
  party,
  district,
  constituency,
  personalOnly,
  onQueryChange,
  onPartyChange,
  onDistrictChange,
  onConstituencyChange,
  onPersonalOnlyChange,
  onReset
}: Props) {
  return (
    <>
      <h1 className="mb-visually-hidden">Kandidierende zur Berlin-Wahl 2026</h1>
      <div className="mx-auto hidden max-w-3xl px-l py-s desk:block">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-s top-1/2 -translate-y-1/2 opacity-l" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Name, Beruf oder Schwerpunkt"
            aria-label="Kandidierende durchsuchen"
            className="w-full rounded-m border border-fg/15 bg-transparent py-xs pl-[28px] pr-s text-m outline-none focus:border-fg"
          />
        </div>
      </div>
      <div className="sticky top-[54px] z-20 hidden border-b border-t border-fg/15 bg-background desk:block">
        <div className="mx-auto flex max-w-3xl items-center gap-s overflow-x-auto px-l py-s [scrollbar-width:none]">
          <Filter size={14} className="shrink-0 opacity-l" aria-hidden="true" />
          <FilterPill label="Bezirk" options={districts} value={district} onChange={onDistrictChange} />
          {district ? (
            <FilterPill
              label="Wahlkreis"
              options={constituencies.map(String)}
              value={constituency ? String(constituency) : null}
              onChange={(value) => onConstituencyChange(value ? Number(value) : null)}
              formatOption={(value) => `WK ${value}`}
            />
          ) : null}
          <FilterPill
            label="Partei"
            options={parties.map(({ value }) => value)}
            value={party}
            onChange={onPartyChange}
            formatOption={(value) => parties.find((option) => option.value === value)?.label ?? value}
          />
          <button
            type="button"
            aria-pressed={personalOnly}
            onClick={() => onPersonalOnlyChange(!personalOnly)}
            className={`shrink-0 rounded-m border border-fg/15 px-m py-s text-m ${personalOnly ? 'bg-surface font-semibold' : ''}`}
          >
            Mit persönlichen Aussagen
          </button>
          <span className="ml-auto shrink-0 text-s caption opacity-l">{candidates.length} Personen</span>
        </div>
      </div>
      <CandidateFilterSheet
        query={query}
        party={party}
        district={district}
        constituency={constituency}
        personalOnly={personalOnly}
        parties={parties}
        districts={districts}
        constituencies={constituencies}
        resultCount={candidates.length}
        onQueryChange={onQueryChange}
        onPartyChange={onPartyChange}
        onDistrictChange={onDistrictChange}
        onConstituencyChange={onConstituencyChange}
        onPersonalOnlyChange={onPersonalOnlyChange}
        onReset={onReset}
      />
      <main className="mx-auto max-w-3xl pb-[72px] desk:px-l desk:pb-xl desk:pt-m">
        {candidates.map((candidate) => (
          <div key={candidate.slug} className="border-b border-fg/15 px-m py-s desk:px-0 desk:py-0">
            <CandidateCard
              candidate={candidate}
              selectedDistrict={district}
              selectedConstituency={constituency}
            />
          </div>
        ))}
      </main>
      {candidates.length === 0 ? (
        <p className="mx-auto max-w-3xl px-l py-xl text-center text-m opacity-l">Keine Kandidierenden mit diesen Filtern gefunden.</p>
      ) : null}
    </>
  )
}
