import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CandidateList } from '@/views/candidates/CandidateList'
import { useCandidateExplorer } from '@/hooks/useCandidateExplorer'
import { getBerlinCatalog } from '@/server/catalog'
import { pageMeta } from '@/lib/seo'
import { validateCandidateSearch } from '@/lib/searchParams'

export const Route = createFileRoute('/')({
  component: CandidatesRoute,
  loader: () => getBerlinCatalog(),
  validateSearch: validateCandidateSearch,
  head: () => pageMeta(
    'Kandidierende zur Berlin-Wahl 2026',
    'Partei-veröffentlichte Kandidaturen zur Wahl des Berliner Abgeordnetenhauses am 20. September 2026.'
  )
})

function CandidatesRoute() {
  const catalog = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/' })
  const explorer = useCandidateExplorer(
    catalog.candidates,
    search.q ?? '',
    search.party ?? null,
    search.district ?? null,
    search.constituency ?? null,
    search.personal ?? false
  )
  return (
    <CandidateList
      candidates={explorer.candidates}
      parties={explorer.parties}
      districts={explorer.districts}
      constituencies={explorer.constituencies}
      query={search.q ?? ''}
      party={search.party ?? null}
      district={search.district ?? null}
      constituency={search.constituency ?? null}
      personalOnly={search.personal ?? false}
      onQueryChange={(q) => navigate({ search: (current) => ({ ...current, q: q.trim() ? q : undefined }) })}
      onPartyChange={(party) => navigate({ search: (current) => ({ ...current, party: party ?? undefined }) })}
      onDistrictChange={(district) => navigate({ search: (current) => ({ ...current, district: district ?? undefined, constituency: undefined }) })}
      onConstituencyChange={(constituency) => navigate({ search: (current) => ({ ...current, constituency: constituency ?? undefined }) })}
      onPersonalOnlyChange={(personal) => navigate({ search: (current) => ({ ...current, personal: personal ? true : undefined }) })}
      onReset={() => navigate({ search: {} })}
    />
  )
}
