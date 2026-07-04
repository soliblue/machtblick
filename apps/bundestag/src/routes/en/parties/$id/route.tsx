import { createFileRoute, Outlet } from '@tanstack/react-router'
import { getParty } from '@/server/partyDetail'
import { PartyDetailShell } from '@/views/partyDetail/PartyDetailShell'
import { seoMeta, canonicalLink, alternateJsonLink, jsonLd, breadcrumbJsonLd, SITE_URL } from '@/lib/seo'
import { hasPartyLine, partyLabel } from '@/lib/parties'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/en/parties/$id')({
  component: PartyDetailLayout,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: ({ params }) => getParty({ data: { slug: params.id, locale: 'en' } }),
  staleTime: Infinity,
  shouldReload: false,
  head: ({ loaderData, params }) => {
    const path = `/en/parties/${params.id}/profile`
    const dataPath = `/en/parties/${params.id}`
    const party = loaderData?.party
    const name = party ? partyLabel(party, 'en') : 'Party'
    const showPartyLine = hasPartyLine(party)
    return {
      meta: seoMeta({
        title: name,
        description: showPartyLine
          ? `${name} in the German Bundestag: seats, cohesion, proposals, members, and agreement with other parliamentary groups.`
          : `${name} in the German Bundestag: seats, members, attendance, and votes.`,
        canonical: path,
      }),
      links: [...canonicalLink(path), ...alternateJsonLink(dataPath)],
      scripts: [
        ...breadcrumbJsonLd([
          { name: 'Parties', path: '/en/parties' },
          { name, path },
        ]),
        ...(loaderData
        ? jsonLd({
            '@context': 'https://schema.org',
            '@type': showPartyLine ? 'PoliticalParty' : 'Organization',
            name: partyLabel(loaderData.party, 'en'),
            numberOfEmployees: { '@type': 'QuantitativeValue', value: loaderData.seats },
            url: `${SITE_URL}${path}`,
            memberOf: { '@type': 'GovernmentOrganization', name: 'German Bundestag' },
            member: loaderData.members.map((m) => ({
              '@type': 'Person',
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
  const data = Route.useLoaderData()
  return (
    <PartyDetailShell data={data}>
      <Outlet />
    </PartyDetailShell>
  )
}
