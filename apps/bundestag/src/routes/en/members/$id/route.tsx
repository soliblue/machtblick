import { createFileRoute, Outlet } from '@tanstack/react-router'
import { getMember } from '@/server/memberDetail'
import { MemberDetailShell } from '@/views/memberDetail/MemberDetailShell'
import { seoMeta, canonicalLink, alternateJsonLink, jsonLd, breadcrumbJsonLd, SITE_URL } from '@/lib/seo'
import { hasPartyLine, PARTY_SLUG } from '@/lib/parties'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/en/members/$id')({
  component: MemberDetailLayout,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: ({ params }) => getMember({ data: { id: params.id, locale: 'en' } }),
  staleTime: Infinity,
  shouldReload: false,
  head: ({ loaderData, params }) => {
    const path = `/en/members/${params.id}/votes`
    const dataPath = `/en/members/${params.id}`
    const name = loaderData?.name ?? 'Member'
    const hasLineHistory = loaderData?.history.some((r) => r.defected !== null) ?? false
    return {
      meta: seoMeta({
        title: name,
        description: hasLineHistory
          ? `${name} (${loaderData?.party ?? ''}, ${loaderData?.state ?? ''}), voting record, attendance, and party-line voting in the Bundestag.`
          : `${name} (${loaderData?.party ?? ''}, ${loaderData?.state ?? ''}), voting record and attendance in the Bundestag.`,
        canonical: path,
        type: 'profile',
      }),
      links: [...canonicalLink(path), ...alternateJsonLink(dataPath)],
      scripts: [
        ...breadcrumbJsonLd([
          { name: 'Members', path: '/en/members' },
          { name, path },
        ]),
        ...(loaderData
        ? jsonLd({
            '@context': 'https://schema.org',
            '@type': 'Person',
            '@id': `${SITE_URL}${path}/`,
            name: loaderData.name,
            jobTitle: 'Member of the German Bundestag',
            worksFor: { '@type': 'GovernmentOrganization', name: 'German Bundestag' },
            memberOf: {
              '@type': hasPartyLine(loaderData.party) ? 'PoliticalParty' : 'Organization',
              name: loaderData.party,
              ...(PARTY_SLUG[loaderData.party] ? { url: `${SITE_URL}/en/parties/${PARTY_SLUG[loaderData.party]}/profile/` } : {}),
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
