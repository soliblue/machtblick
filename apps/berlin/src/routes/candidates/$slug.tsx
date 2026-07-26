import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getBerlinCandidate } from '@/server/candidate'
import { CandidateDetail } from '@/views/candidateDetail/CandidateDetail'
import { CANDIDATE_DETAIL_TAB_IDS, type CandidateDetailTab } from '@/lib/candidateDetailTabs'
import { useCandidateDetailTabs } from '@/hooks/useCandidateDetailTabs'
import { pageMeta } from '@/lib/seo'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

type Search = {
  tab?: CandidateDetailTab
}

export const Route = createFileRoute('/candidates/$slug')({
  component: CandidateRoute,
  notFoundComponent: NotFoundPage,
  loader: ({ params }) => getBerlinCandidate({ data: params.slug }),
  validateSearch: (search: Record<string, unknown>): Search => ({
    tab: CANDIDATE_DETAIL_TAB_IDS.includes(search.tab as CandidateDetailTab)
      ? search.tab as CandidateDetailTab
      : undefined
  }),
  head: ({ loaderData, params }) => pageMeta(
    loaderData?.candidate.name ?? 'Kandidatur',
    `${loaderData?.candidate.name ?? 'Kandidatur'} bei der Berliner Abgeordnetenhauswahl 2026.`,
    `/candidates/${loaderData?.candidate.slug ?? params.slug}/`
  )
})

function CandidateRoute() {
  const data = Route.useLoaderData()
  const { tab } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const detailTabs = useCandidateDetailTabs(data, tab)
  return (
    <CandidateDetail
      data={data}
      availableTabs={detailTabs.tabs}
      activeTab={detailTabs.activeTab}
      onTabChange={(nextTab) => navigate({
        search: (search) => ({ ...search, tab: nextTab === detailTabs.tabs[0] ? undefined : nextTab }),
        resetScroll: false,
        replace: true
      })}
    />
  )
}
