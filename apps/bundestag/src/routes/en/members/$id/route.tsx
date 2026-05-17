import { createFileRoute, Outlet } from '@tanstack/react-router'
import { getMember } from '@/server/members'
import { MemberDetailShell } from '@/views/memberDetail/MemberDetailShell'
import { seoMeta, canonicalLink, alternateJsonLink, jsonLd, SITE_URL } from '@/lib/seo'
import { hasPartyLine } from '@/lib/parties'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/en/members/$id')({
  component: MemberDetailLayout,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: ({ params }) => getMember({ data: { id: params.id, locale: 'en' } }),
  staleTime: Infinity,
  shouldReload: false,
  head: ({ loaderData, params }) => {
    const path = `/en/members/${params.id}`
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
      links: [...canonicalLink(path), ...alternateJsonLink(path)],
      scripts: loaderData
        ? jsonLd({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: loaderData.name,
            jobTitle: 'Member of the German Bundestag',
            worksFor: { '@type': 'GovernmentOrganization', name: 'German Bundestag' },
            affiliation: {
              '@type': hasPartyLine(loaderData.party) ? 'PoliticalParty' : 'Organization',
              name: loaderData.party,
            },
            homeLocation: { '@type': 'AdministrativeArea', name: loaderData.state },
            url: `${SITE_URL}${path}`,
            ...(loaderData.pictureUrl ? { image: loaderData.pictureUrl } : {}),
          })
        : [],
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
