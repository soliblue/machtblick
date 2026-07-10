import { createFileRoute, notFound } from '@tanstack/react-router'
import { mpPartyDetail } from '@/server/mpParties'
import { MpPartyDetail } from '@/views/mp/MpPartyDetail'
import { parliamentBySlug, type ParliamentSlug } from '@/lib/parliaments'
import { seoMeta, canonicalLink } from '@/lib/seo'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/$section/parties/$slug')({
  component: SectionPartyDetailRoute,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: async ({ params }) => {
    const p = parliamentBySlug(params.section)
    if (!p) throw notFound()
    return mpPartyDetail({ data: { parliament: p.dbKey, slug: params.slug } })
  },
  head: ({ loaderData, params }) => {
    const p = parliamentBySlug(params.section)
    if (!p || !loaderData) return {}
    return {
      meta: seoMeta({ title: `${loaderData.name} · ${p.shortName}`, description: `${loaderData.name} im ${p.name}: ${loaderData.seats} Sitze, Geschlossenheit und Anwesenheit.`, canonical: `/${p.slug}/parties/${loaderData.slug}` }),
      links: canonicalLink(`/${p.slug}/parties/${loaderData.slug}`),
    }
  },
})

function SectionPartyDetailRoute() {
  const data = Route.useLoaderData()
  const { section } = Route.useParams()
  return <MpPartyDetail section={section as ParliamentSlug} data={data} />
}
