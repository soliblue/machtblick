import { createFileRoute, notFound } from '@tanstack/react-router'
import { mpVotesList } from '@/server/mpVotes'
import { MpVotesList } from '@/views/mp/MpVotesList'
import { parliamentBySlug, type ParliamentSlug } from '@/lib/parliaments'
import { seoMeta, canonicalLink } from '@/lib/seo'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/$section/')({
  component: SectionVotesRoute,
  notFoundComponent: NotFoundPage,
  loader: async ({ params }) => {
    const p = parliamentBySlug(params.section)
    if (!p) throw notFound()
    return mpVotesList({ data: p.dbKey })
  },
  head: ({ params }) => {
    const p = parliamentBySlug(params.section)
    if (!p) return {}
    return {
      meta: seoMeta({ title: `Abstimmungen · ${p.name}`, description: `Abstimmungen im ${p.name}: Ergebnisse, Mehrheiten und das Stimmverhalten der Fraktionen.`, canonical: `/${p.slug}` }),
      links: canonicalLink(`/${p.slug}`),
    }
  },
})

function SectionVotesRoute() {
  const votes = Route.useLoaderData()
  const { section } = Route.useParams()
  return <MpVotesList section={section as ParliamentSlug} votes={votes} />
}
