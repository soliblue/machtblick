import { createFileRoute, notFound } from '@tanstack/react-router'
import { mpVoteDetail } from '@/server/mpVoteDetail'
import { MpVoteDetail } from '@/views/mp/MpVoteDetail'
import { parliamentBySlug, type ParliamentSlug } from '@/lib/parliaments'
import { seoMeta, canonicalLink } from '@/lib/seo'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/$section/votes/$id')({
  component: SectionVoteDetailRoute,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: async ({ params }) => {
    const p = parliamentBySlug(params.section)
    if (!p) throw notFound()
    return mpVoteDetail({ data: { parliament: p.dbKey, id: params.id } })
  },
  head: ({ loaderData, params }) => {
    const p = parliamentBySlug(params.section)
    const v = loaderData?.vote
    if (!p || !v) return {}
    const title = v.titleDe ?? v.title
    return {
      meta: seoMeta({ title: `${title} · ${p.shortName}`, description: `${v.result === 'angenommen' ? 'Angenommen' : 'Abgelehnt'} mit ${v.yes} zu ${v.no} Stimmen im ${p.name}.`, canonical: `/${p.slug}/votes/${v.id}`, type: 'article' }),
      links: canonicalLink(`/${p.slug}/votes/${v.id}`),
    }
  },
})

function SectionVoteDetailRoute() {
  const data = Route.useLoaderData()
  const { section } = Route.useParams()
  return <MpVoteDetail section={section as ParliamentSlug} data={data} />
}
