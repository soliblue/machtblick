import { createFileRoute, Outlet } from '@tanstack/react-router'
import { getMember } from '@/server/members'
import { MemberDetailShell } from '@/views/memberDetail/MemberDetailShell'
import { seoMeta, canonicalLink, alternateJsonLink, jsonLd, SITE_URL } from '@/lib/seo'
import { hasPartyLine } from '@/lib/parties'

export const Route = createFileRoute('/members/$id')({
  component: MemberDetailLayout,
  loader: ({ params }) => getMember({ data: params.id }),
  staleTime: Infinity,
  shouldReload: false,
  head: ({ loaderData, params }) => {
    const path = `/members/${params.id}`
    const name = loaderData?.name ?? 'Abgeordnete:r'
    const hasLineHistory = loaderData?.history.some((r) => r.defected !== null) ?? false
    return {
      meta: seoMeta({
        title: name,
        description: hasLineHistory
          ? `${name} (${loaderData?.party ?? ''}, ${loaderData?.state ?? ''}) — Abstimmungsverhalten, Anwesenheit und Linientreue im Deutschen Bundestag.`
          : `${name} (${loaderData?.party ?? ''}, ${loaderData?.state ?? ''}) — Abstimmungsverhalten und Anwesenheit im Deutschen Bundestag.`,
        canonical: path,
        type: 'profile',
      }),
      links: [...canonicalLink(path), ...alternateJsonLink(path)],
      scripts: loaderData
        ? jsonLd({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: loaderData.name,
            jobTitle: 'Mitglied des Deutschen Bundestages',
            worksFor: { '@type': 'GovernmentOrganization', name: 'Deutscher Bundestag' },
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
