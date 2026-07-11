import { createFileRoute, Outlet } from '@tanstack/react-router'
import { getParty } from '@/server/partyDetail'
import { getPartyHistory } from '@/server/getPartyHistory'
import { seoMeta, canonicalLink, alternateJsonLink, jsonLd, breadcrumbJsonLd, SITE_URL } from '@/lib/seo'
import { PARTY_LABEL, hasPartyLine } from '@/lib/parties'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/parties/$id')({
  component: PartyDetailLayout,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: async ({ params }) => {
    const [detail, history] = await Promise.all([
      getParty({ data: params.id }),
      getPartyHistory({ data: params.id }),
    ])
    return { detail, history }
  },
  staleTime: Infinity,
  shouldReload: false,
  head: ({ loaderData, params }) => {
    const path = `/parties/${params.id}`
    const dataPath = `/parties/${params.id}`
    const detail = loaderData?.detail
    const party = detail?.party
    const name = party ? (PARTY_LABEL[party] ?? party) : 'Fraktion'
    const showPartyLine = hasPartyLine(party)
    const ogImage = ['cdu-csu', 'spd', 'afd', 'gruene', 'linke'].includes(params.id)
      ? { image: `/og/parties/${params.id}.png`, imageAlt: `${name} im Bundestag: Sitze und Anteil der Fraktion.` }
      : {}
    return {
      meta: seoMeta({
        title: `${name} im Bundestag: Abstimmungsverhalten`,
        description: showPartyLine
          ? `${name} im Deutschen Bundestag${detail ? ` mit ${detail.seats} Sitzen` : ''}: Geschlossenheit, Abweichler, Anträge, Mitglieder und Übereinstimmung mit anderen Fraktionen.`
          : `${name} im Deutschen Bundestag${detail ? ` mit ${detail.seats} Sitzen` : ''}: Mitglieder, Anwesenheit und Abstimmungsverhalten bei namentlichen Abstimmungen.`,
        canonical: path,
        ...ogImage,
      }),
      links: [...canonicalLink(path), ...alternateJsonLink(dataPath)],
      scripts: [
        ...breadcrumbJsonLd([
          { name: 'Fraktionen', path: '/parties' },
          { name, path },
        ]),
        ...(detail
        ? jsonLd({
            '@context': 'https://schema.org',
            '@type': showPartyLine ? 'PoliticalParty' : 'Organization',
            '@id': `${SITE_URL}${path}/`,
            name: PARTY_LABEL[detail.party] ?? detail.party,
            numberOfEmployees: { '@type': 'QuantitativeValue', value: detail.seats },
            url: `${SITE_URL}${path}`,
            memberOf: { '@type': 'GovernmentOrganization', name: 'Deutscher Bundestag' },
            member: detail.members.map((m) => ({
              '@type': 'Person',
              '@id': `${SITE_URL}/members/${m.id}/votes/`,
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
  return <Outlet />
}
