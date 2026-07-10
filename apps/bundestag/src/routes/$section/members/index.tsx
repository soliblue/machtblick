import { createFileRoute, notFound } from '@tanstack/react-router'
import { mpMembersList } from '@/server/mpMembers'
import { MpMembersList } from '@/views/mp/MpMembersList'
import { parliamentBySlug, type ParliamentSlug } from '@/lib/parliaments'
import { seoMeta, canonicalLink } from '@/lib/seo'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/$section/members/')({
  component: SectionMembersRoute,
  notFoundComponent: NotFoundPage,
  loader: async ({ params }) => {
    const p = parliamentBySlug(params.section)
    if (!p) throw notFound()
    return mpMembersList({ data: p.dbKey })
  },
  head: ({ params }) => {
    const p = parliamentBySlug(params.section)
    if (!p) return {}
    return {
      meta: seoMeta({ title: `Abgeordnete · ${p.name}`, description: `Die Abgeordneten des ${p.name} mit Anwesenheit und Fraktionslinie.`, canonical: `/${p.slug}/members` }),
      links: canonicalLink(`/${p.slug}/members`),
    }
  },
})

function SectionMembersRoute() {
  const members = Route.useLoaderData()
  const { section } = Route.useParams()
  return <MpMembersList section={section as ParliamentSlug} members={members} />
}
