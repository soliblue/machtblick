import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getVote } from '@/server/voteDetail'
import { getVoteSponsors } from '@/server/voteSponsors'
import { VoteDetail, type VoteTab, isVoteTab } from '@/views/voteDetail/VoteDetail'
import { voteDetailHead } from '@/lib/routeHeads'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'
import { useVoteFlags } from '@/hooks/useVoteFlags'

type Search = { tab?: VoteTab }

export const Route = createFileRoute('/en/votes/$id')({
  component: VoteDetailRoute,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: async ({ params }) => {
    const [detail, sponsors] = await Promise.all([
      getVote({ data: { id: params.id, locale: 'en' } }),
      getVoteSponsors({ data: params.id }),
    ])
    return { ...detail, sponsors }
  },
  validateSearch: (search: Record<string, unknown>): Search => ({
    tab: isVoteTab(search.tab) ? search.tab : undefined,
  }),
  head: ({ loaderData, params }) => voteDetailHead(loaderData, params, 'en'),
})

function VoteDetailRoute() {
  const data = Route.useLoaderData()
  const { tab } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { savedIds, seenIds, toggleSaved, toggleSeen } = useVoteFlags()
  return (
    <VoteDetail
      data={data}
      activeTab={tab ?? 'ergebnis'}
      onTabChange={(t) => navigate({ search: (s) => ({ ...s, tab: t === 'ergebnis' ? undefined : t }), resetScroll: false, replace: true })}
      isSaved={savedIds.has(data.vote.id)}
      isSeen={seenIds.has(data.vote.id)}
      onToggleSaved={() => toggleSaved(data.vote.id)}
      onToggleSeen={() => toggleSeen(data.vote.id)}
    />
  )
}
