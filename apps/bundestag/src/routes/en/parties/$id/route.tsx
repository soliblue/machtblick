import { createFileRoute, Outlet } from '@tanstack/react-router'
import { getParty } from '@/server/partyDetail'
import { getPartyHistory } from '@/server/getPartyHistory'
import { partyDetailHead } from '@/lib/routeHeads'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/en/parties/$id')({
  component: PartyDetailLayout,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: async ({ params }) => {
    const [detail, history] = await Promise.all([
      getParty({ data: { slug: params.id, locale: 'en' } }),
      getPartyHistory({ data: params.id }),
    ])
    return { detail, history }
  },
  staleTime: Infinity,
  shouldReload: false,
  head: ({ loaderData, params }) => partyDetailHead(loaderData, params, 'en'),
})

function PartyDetailLayout() {
  return <Outlet />
}
