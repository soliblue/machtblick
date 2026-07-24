import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getAntrag } from '@/server/antraege'
import { AntragDetail, type AntragTab, isAntragTab } from '@/views/antragDetail/AntragDetail'
import { motionDetailHead } from '@/lib/routeHeads'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

type Search = { tab?: AntragTab }

export const Route = createFileRoute('/motions/$id')({
  component: AntragDetailRoute,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: ({ params }) => getAntrag({ data: params.id }),
  validateSearch: (search: Record<string, unknown>): Search => ({
    tab: isAntragTab(search.tab) ? search.tab : undefined,
  }),
  head: ({ loaderData, params }) => motionDetailHead(loaderData, params, 'de'),
})

function AntragDetailRoute() {
  const data = Route.useLoaderData()
  const { tab } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const defaultTab: AntragTab = data.linkedVotes.length > 0 ? 'ergebnis' : 'details'
  return (
    <AntragDetail
      data={data}
      activeTab={tab ?? defaultTab}
      onTabChange={(nextTab) => navigate({ search: (search) => ({ ...search, tab: nextTab === defaultTab ? undefined : nextTab }), resetScroll: false, replace: true })}
    />
  )
}
