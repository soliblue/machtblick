import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getVote } from '@/server/voteDetail'
import { getVoteSponsors } from '@/server/voteSponsors'
import { VoteDetail, type VoteTab, isVoteTab } from '@/views/voteDetail/VoteDetail'
import { seoMeta, canonicalLink, alternateJsonLink, breadcrumbJsonLd, jsonLd, SITE_URL } from '@/lib/seo'
import { formatDateLong } from '@/lib/format'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

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
  head: ({ loaderData, params }) => {
    const path = `/en/votes/${params.id}`
    const v = loaderData?.vote
    const headline = v?.cleanTitle ?? null
    const namentlich = v?.voteType === 'namentlich'
    const title = v && headline ? (namentlich ? `${headline}: ${v.yes} to ${v.no}` : headline) : 'Vote'
    const result = v?.result === 'angenommen' ? 'Passed' : v?.result === 'abgelehnt' ? 'Rejected' : 'Decided'
    const lead = v && headline
      ? namentlich
        ? `${result} ${v.yes} to ${v.no}: ${headline}.`
        : `${result}: ${headline}.`
      : 'Vote in the German Bundestag.'
    const core = v && headline ? `${lead} ${namentlich ? 'Roll-call vote in the German Bundestag' : 'Bundestag vote'} on ${formatDateLong(v.date, 'en')}.` : lead
    const full = v && headline ? `${core} Sponsor: ${loaderData?.proposingParty ?? 'unknown'}.` : lead
    const desc = full.length <= 160 ? full : core.length <= 160 ? core : lead
    const ogImage = namentlich
      ? { image: `/og/votes/${params.id}.png`, imageAlt: `Bundestag vote result: ${headline ?? 'Vote'}` }
      : {}
    return {
      meta: [
        ...seoMeta({ title, description: desc, canonical: path, type: 'article', ...ogImage }),
        ...(v ? [{ property: 'article:published_time', content: v.date }] : []),
      ],
      links: [...canonicalLink(path), ...alternateJsonLink(path)],
      scripts: [
        ...breadcrumbJsonLd([
          { name: 'Votes', path: '/en/votes' },
          { name: headline ?? 'Vote', path },
        ]),
        ...(v && headline
          ? jsonLd({
              '@context': 'https://schema.org',
              '@type': 'Event',
              '@id': `${SITE_URL}${path}/`,
              name: headline,
              startDate: v.date,
              location: { '@type': 'Place', name: 'Deutscher Bundestag', address: { '@type': 'PostalAddress', addressLocality: 'Berlin', addressCountry: 'DE' } },
              organizer: { '@type': 'GovernmentOrganization', name: 'German Bundestag' },
              url: `${SITE_URL}${path}/`,
              description: v.voteType === 'namentlich'
                ? `Roll-call vote on ${formatDateLong(v.date, 'en')}: ${result.toLowerCase()}. ${v.yes} yes, ${v.no} no, ${v.abstain} abstentions, ${v.absent} not cast.`
                : `Vote on ${formatDateLong(v.date, 'en')}: ${result.toLowerCase()}.`,
              ...(loaderData?.sponsors.antraege.length && loaderData.sponsors.antraege.length <= 3
                ? {
                    about: loaderData.sponsors.antraege.map((a) => ({
                      '@type': 'Legislation',
                      name: a.title,
                      url: `${SITE_URL}/motions/${a.antragId}/`,
                      ...(a.drucksache ? { legislationIdentifier: a.drucksache } : {}),
                    })),
                  }
                : {}),
            })
          : []),
      ],
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
