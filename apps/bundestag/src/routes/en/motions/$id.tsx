import { createFileRoute } from '@tanstack/react-router'
import { getAntrag } from '@/server/antraege'
import { AntragDetail } from '@/views/antragDetail/AntragDetail'
import { seoMeta, canonicalLink, alternateJsonLink } from '@/lib/seo'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/en/motions/$id')({
  component: AntragDetailRoute,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: ({ params }) => getAntrag({ data: { id: params.id, locale: 'en' } }),
  head: ({ loaderData, params }) => {
    const path = `/en/motions/${params.id}`
    const title = loaderData?.antrag.cleanTitle ?? loaderData?.antrag.title ?? 'Motion'
    const desc = loaderData?.antrag.summarySimplified ?? loaderData?.antrag.abstract ?? 'Motion in the German Bundestag.'
    return {
      meta: seoMeta({ title, description: desc, canonical: path, type: 'article' }),
      links: [...canonicalLink(path), ...alternateJsonLink(path)],
    }
  },
})

function AntragDetailRoute() {
  return <AntragDetail data={Route.useLoaderData()} />
}
