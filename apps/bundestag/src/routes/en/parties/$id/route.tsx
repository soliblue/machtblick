import { createFileRoute, Outlet } from '@tanstack/react-router'
import { getParty } from '@/server/partyDetail'
import { getPartyHistory } from '@/server/getPartyHistory'
import { seoMeta, canonicalLink, alternateJsonLink, jsonLd, breadcrumbJsonLd, SITE_URL } from '@/lib/seo'
import { hasPartyLine, partyLabel } from '@/lib/parties'
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
  head: ({ loaderData, params }) => {
    const path = `/en/parties/${params.id}`
    const dataPath = `/en/parties/${params.id}`
    const detail = loaderData?.detail
    const party = detail?.party
    const name = party ? partyLabel(party, 'en') : 'Party'
    const showPartyLine = hasPartyLine(party)
    const ogImage = ['cdu-csu', 'spd', 'afd', 'gruene', 'linke'].includes(params.id)
      ? { image: `/og/parties/${params.id}.png`, imageAlt: `${name} in the Bundestag: seats and share of the parliamentary group.` }
      : {}
    return {
      meta: seoMeta({
        title: `${name} in the Bundestag: Voting record`,
        description: showPartyLine
          ? `${name} in the German Bundestag${detail ? ` with ${detail.seats} seats` : ''}: cohesion, defectors, motions, members, and agreement with other parliamentary groups.`
          : `${name} in the German Bundestag${detail ? ` with ${detail.seats} seats` : ''}: members, attendance, and voting behavior in roll-call votes.`,
        canonical: path,
        ...ogImage,
      }),
      links: [...canonicalLink(path), ...alternateJsonLink(dataPath)],
      scripts: [
        ...breadcrumbJsonLd([
          { name: 'Parties', path: '/en/parties' },
          { name, path },
        ]),
        ...(detail
        ? jsonLd({
            '@context': 'https://schema.org',
            '@type': showPartyLine ? 'PoliticalParty' : 'Organization',
            '@id': `${SITE_URL}${path}/`,
            name: partyLabel(detail.party, 'en'),
            numberOfEmployees: { '@type': 'QuantitativeValue', value: detail.seats },
            url: `${SITE_URL}${path}`,
            memberOf: { '@type': 'GovernmentOrganization', name: 'German Bundestag' },
            member: detail.members.map((m) => ({
              '@type': 'Person',
              '@id': `${SITE_URL}/en/members/${m.id}/votes/`,
              name: m.name,
              url: `${SITE_URL}/en/members/${m.id}/votes/`,
            })),
          })
        : []),
      ],
    }
  },
})

function PartyDetailLayout() {
  return <Outlet />
}
