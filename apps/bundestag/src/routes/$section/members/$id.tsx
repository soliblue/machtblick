import { createFileRoute, notFound } from '@tanstack/react-router'
import { mpMemberDetail } from '@/server/mpMemberDetail'
import { MpMemberDetail } from '@/views/mp/MpMemberDetail'
import { parliamentBySlug, type ParliamentSlug } from '@/lib/parliaments'
import { seoMeta, canonicalLink } from '@/lib/seo'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/$section/members/$id')({
  component: SectionMemberDetailRoute,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: async ({ params }) => {
    const p = parliamentBySlug(params.section)
    if (!p) throw notFound()
    return mpMemberDetail({ data: { parliament: p.dbKey, id: params.id } })
  },
  head: ({ loaderData, params }) => {
    const p = parliamentBySlug(params.section)
    const m = loaderData?.member
    if (!p || !m) return {}
    return {
      meta: seoMeta({ title: `${m.name} · ${p.shortName}`, description: `${m.name}, ${m.label} im ${p.name}. Abstimmungsverhalten und Anwesenheit.`, canonical: `/${p.slug}/members/${m.id}`, type: 'profile' }),
      links: canonicalLink(`/${p.slug}/members/${m.id}`),
    }
  },
})

function SectionMemberDetailRoute() {
  const data = Route.useLoaderData()
  const { section } = Route.useParams()
  return <MpMemberDetail section={section as ParliamentSlug} data={data} />
}
