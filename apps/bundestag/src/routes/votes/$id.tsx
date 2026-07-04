import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getVote } from '@/server/voteDetail'
import { getVoteSponsors } from '@/server/voteSponsors'
import { VoteDetail, type VoteTab, isVoteTab } from '@/views/voteDetail/VoteDetail'
import { seoMeta, canonicalLink, alternateJsonLink, breadcrumbJsonLd } from '@/lib/seo'
import { formatDateLong } from '@/lib/format'
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
    const headline = v?.cleanTitle ?? null
    const title = headline ?? 'Abstimmung'
    const desc = v && headline
      ? `${headline}. Abstimmung im Bundestag am ${formatDateLong(v.date)}: ${v.result}. Antragsteller: ${loaderData?.proposingParty ?? 'unbekannt'}.`
      : 'Namentliche Abstimmung im Deutschen Bundestag.'
    const ogImage = v?.voteType === 'namentlich'
      ? { image: `/og/votes/${params.id}.png`, imageAlt: `Abstimmungsergebnis im Bundestag: ${title}` }
      : {}
    return {
      meta: [
        ...seoMeta({ title, description: desc, canonical: path, type: 'article', ...ogImage }),
        ...(v ? [{ property: 'article:published_time', content: v.date }] : []),
      ],
      links: [...canonicalLink(path), ...alternateJsonLink(path)],
      scripts: breadcrumbJsonLd([
        { name: 'Abstimmungen', path: '/votes' },
        { name: title, path },
      ]),
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
