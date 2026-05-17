import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getVote } from '@/server/votes'
import { getVoteSponsors } from '@/server/voteSponsors'
import { VoteDetail, type VoteTab, isVoteTab } from '@/views/voteDetail/VoteDetail'
import { seoMeta, canonicalLink, alternateJsonLink } from '@/lib/seo'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

type Search = { tab?: VoteTab }

export const Route = createFileRoute('/votes/$id')({
  component: VoteDetailRoute,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: async ({ params }) => {
    const [detail, sponsors] = await Promise.all([
      getVote({ data: params.id }),
      getVoteSponsors({ data: params.id }),
    ])
    return { ...detail, sponsors }
  },
  validateSearch: (search: Record<string, unknown>): Search => ({
    tab: isVoteTab(search.tab) ? search.tab : undefined,
  }),
  head: ({ loaderData, params }) => {
    const path = `/votes/${params.id}`
    const v = loaderData?.vote
    const headline = v ? (v.cleanTitle ?? v.title) : null
    const title = headline ?? 'Abstimmung'
    const desc = v && headline
      ? `${headline}. Abstimmung im Bundestag am ${v.date}: ${v.result}. Antragsteller: ${loaderData?.proposingParty ?? 'unbekannt'}.`
      : 'Namentliche Abstimmung im Deutschen Bundestag.'
    return {
      meta: seoMeta({ title, description: desc, canonical: path, type: 'article' }),
      links: [...canonicalLink(path), ...alternateJsonLink(path)],
    }
  },
})

function VoteDetailRoute() {
  const data = Route.useLoaderData()
  const { tab } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const active = tab ?? 'ergebnis'
  return (
    <VoteDetail
      data={data}
      activeTab={active}
      onTabChange={(t) => navigate({ search: (s) => ({ ...s, tab: t === 'ergebnis' ? undefined : t }), resetScroll: false, replace: true })}
    />
  )
}
