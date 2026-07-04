import { createFileRoute, Outlet } from '@tanstack/react-router'
import { getMember } from '@/server/memberDetail'
import { MemberDetailShell } from '@/views/memberDetail/MemberDetailShell'
import { seoMeta, canonicalLink, alternateJsonLink, jsonLd, breadcrumbJsonLd, SITE_URL } from '@/lib/seo'
import { hasPartyLine, PARTY_SLUG } from '@/lib/parties'
import { pct } from '@/lib/format'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/members/$id')({
  component: MemberDetailLayout,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: ({ params }) => getMember({ data: params.id }),
  staleTime: Infinity,
  shouldReload: false,
  head: ({ loaderData, params }) => {
    const path = `/members/${params.id}/votes`
    const dataPath = `/members/${params.id}`
    const name = loaderData?.name ?? 'Abgeordnete:r'
    const who = loaderData ? `${name} (${[loaderData.party, loaderData.state].filter(Boolean).join(', ')})` : name
    return {
      meta: seoMeta({
        title: loaderData ? `${name} (${loaderData.party})` : name,
        description: loaderData
          ? loaderData.loyalty !== null
            ? `${who} im Bundestag: ${pct(loaderData.attendance)} Anwesenheit und ${pct(loaderData.loyalty)} Linientreue bei namentlichen Abstimmungen.`
            : `${who} im Bundestag: ${pct(loaderData.attendance)} Anwesenheit bei namentlichen Abstimmungen. Reden und Anträge im Überblick.`
          : 'Abstimmungsverhalten, Anwesenheit und Linientreue im Deutschen Bundestag.',
        canonical: path,
        type: 'profile',
      }),
      links: [...canonicalLink(path), ...alternateJsonLink(dataPath)],
      scripts: [
        ...breadcrumbJsonLd([
          { name: 'Abgeordnete', path: '/members' },
          { name, path },
        ]),
        ...(loaderData
        ? jsonLd({
            '@context': 'https://schema.org',
            '@type': 'Person',
            '@id': `${SITE_URL}${path}/`,
            name: loaderData.name,
            jobTitle: 'Mitglied des Deutschen Bundestages',
            worksFor: { '@type': 'GovernmentOrganization', name: 'Deutscher Bundestag' },
            memberOf: {
              '@type': hasPartyLine(loaderData.party) ? 'PoliticalParty' : 'Organization',
              name: loaderData.party,
              ...(PARTY_SLUG[loaderData.party] ? { url: `${SITE_URL}/parties/${PARTY_SLUG[loaderData.party]}/profile/` } : {}),
            },
            ...(loaderData.state
              ? {
                  homeLocation: { '@type': 'AdministrativeArea', name: loaderData.state },
                  address: { '@type': 'PostalAddress', addressRegion: loaderData.state, addressCountry: 'DE' },
                }
              : {}),
            url: `${SITE_URL}${path}`,
            ...(loaderData.pictureUrl ? { image: loaderData.pictureUrl } : {}),
            ...(loaderData.sameAs?.length ? { sameAs: loaderData.sameAs } : {}),
          })
        : []),
      ],
    }
  },
})

function MemberDetailLayout() {
  const data = Route.useLoaderData()
  return (
    <MemberDetailShell data={data}>
      <Outlet />
    </MemberDetailShell>
  )
}
