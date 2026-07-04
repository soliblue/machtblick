import { createFileRoute, Outlet } from '@tanstack/react-router'
import { getParty } from '@/server/parties'
import { PartyDetailShell } from '@/views/partyDetail/PartyDetailShell'
import { seoMeta, canonicalLink, alternateJsonLink, jsonLd, breadcrumbJsonLd, SITE_URL } from '@/lib/seo'
import { PARTY_LABEL, hasPartyLine } from '@/lib/parties'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/parties/$id')({
  component: PartyDetailLayout,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: ({ params }) => getParty({ data: params.id }),
  staleTime: Infinity,
  shouldReload: false,
  head: ({ loaderData, params }) => {
    const path = `/parties/${params.id}/profile`
    const dataPath = `/parties/${params.id}`
    const party = loaderData?.party
    const name = party ? (PARTY_LABEL[party] ?? party) : 'Fraktion'
    const showPartyLine = hasPartyLine(party)
    return {
      meta: seoMeta({
        title: name,
        description: showPartyLine
          ? `${name} im Deutschen Bundestag: Sitze, Geschlossenheit, Anträge, Mitglieder und Übereinstimmung mit anderen Fraktionen.`
          : `${name} im Deutschen Bundestag: Sitze, Mitglieder, Anwesenheit und Abstimmungen.`,
        canonical: path,
      }),
      links: [...canonicalLink(path), ...alternateJsonLink(dataPath)],
      scripts: [
        ...breadcrumbJsonLd([
          { name: 'Fraktionen', path: '/parties' },
          { name, path },
        ]),
        ...(loaderData
        ? jsonLd({
            '@context': 'https://schema.org',
            '@type': showPartyLine ? 'PoliticalParty' : 'Organization',
            name: PARTY_LABEL[loaderData.party] ?? loaderData.party,
            numberOfEmployees: { '@type': 'QuantitativeValue', value: loaderData.seats },
            url: `${SITE_URL}${path}`,
            memberOf: { '@type': 'GovernmentOrganization', name: 'Deutscher Bundestag' },
            member: loaderData.members.map((m) => ({
              '@type': 'Person',
              name: m.name,
              url: `${SITE_URL}/members/${m.id}/votes/`,
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
