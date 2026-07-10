import { createFileRoute, notFound } from '@tanstack/react-router'
import { mpPartiesList } from '@/server/mpParties'
import { MpPartiesList } from '@/views/mp/MpPartiesList'
import { parliamentBySlug, type ParliamentSlug } from '@/lib/parliaments'
import { seoMeta, canonicalLink } from '@/lib/seo'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/$section/parties/')({
  component: SectionPartiesRoute,
  notFoundComponent: NotFoundPage,
  loader: async ({ params }) => {
    const p = parliamentBySlug(params.section)
    if (!p) throw notFound()
    return mpPartiesList({ data: p.dbKey })
  },
  head: ({ params }) => {
    const p = parliamentBySlug(params.section)
    if (!p) return {}
    return {
      meta: seoMeta({ title: `Fraktionen · ${p.name}`, description: `Die Fraktionen im ${p.name}: Sitze, Geschlossenheit und Anwesenheit.`, canonical: `/${p.slug}/parties` }),
      links: canonicalLink(`/${p.slug}/parties`),
    }
  },
})

function SectionPartiesRoute() {
  const parties = Route.useLoaderData()
  const { section } = Route.useParams()
  return <MpPartiesList section={section as ParliamentSlug} parties={parties} />
}
