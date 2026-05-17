import { createFileRoute } from '@tanstack/react-router'
import { getAntrag } from '@/server/antraege'
import { AntragDetail } from '@/views/antragDetail/AntragDetail'
import { seoMeta, canonicalLink, alternateJsonLink } from '@/lib/seo'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/motions/$id')({
  component: AntragDetailRoute,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: ({ params }) => getAntrag({ data: params.id }),
  head: ({ loaderData, params }) => {
    const path = `/motions/${params.id}`
    const title = loaderData?.antrag.cleanTitle ?? loaderData?.antrag.title ?? 'Antrag'
    const desc = loaderData?.antrag.summarySimplified ?? loaderData?.antrag.abstract ?? 'Antrag im Deutschen Bundestag.'
    return {
      meta: seoMeta({ title, description: desc, canonical: path, type: 'article' }),
      links: [...canonicalLink(path), ...alternateJsonLink(path)],
    }
  },
})

function AntragDetailRoute() {
  return <AntragDetail data={Route.useLoaderData()} />
}
