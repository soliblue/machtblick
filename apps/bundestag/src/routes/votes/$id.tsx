import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getVote } from '@/server/votes'
import { VoteDetail, type VoteTab, isVoteTab } from '@/views/voteDetail/VoteDetail'
import { seoMeta, canonicalLink, SITE_URL } from '@/lib/seo'

type Search = { tab?: VoteTab }

export const Route = createFileRoute('/votes/$id')({
  component: VoteDetailRoute,
  loader: ({ params }) => getVote({ data: params.id }),
  validateSearch: (search: Record<string, unknown>): Search => ({
    tab: isVoteTab(search.tab) ? search.tab : undefined,
  }),
  head: ({ loaderData, params }) => {
    const path = `/votes/${params.id}`
    const v = loaderData?.vote
    const title = v?.title ?? 'Abstimmung'
    const desc = v
      ? `${v.title} — Abstimmung im Bundestag am ${v.date}: ${v.result}. Antragsteller: ${loaderData?.proposingParty ?? 'unbekannt'}.`
      : 'Namentliche Abstimmung im Deutschen Bundestag.'
    return {
      meta: seoMeta({ title, description: desc, canonical: path, type: 'article' }),
      links: canonicalLink(path),
      scripts: v
        ? [{
            type: 'application/ld+json',
            children: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: v.title,
              datePublished: v.date,
              inLanguage: 'de-DE',
              url: `${SITE_URL}${path}`,
              about: { '@type': 'VoteAction', name: v.title, result: v.result },
              author: { '@type': 'Organization', name: 'Deutscher Bundestag' },
              publisher: { '@type': 'Organization', name: 'Machtblick', url: SITE_URL },
            }),
          }]
        : [],
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
      onTabChange={(t) => navigate({ search: (s) => ({ ...s, tab: t === 'ergebnis' ? undefined : t }) })}
    />
  )
}
