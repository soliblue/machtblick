import { createFileRoute } from '@tanstack/react-router'
import { getAntrag } from '@/server/antraege'
import { AntragDetail } from '@/views/antragDetail/AntragDetail'
import { seoMeta, canonicalLink, alternateJsonLink, jsonLd, plainDescription, SITE_URL } from '@/lib/seo'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/en/motions/$id')({
  component: AntragDetailRoute,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: ({ params }) => getAntrag({ data: { id: params.id, locale: 'en' } }),
  head: ({ loaderData, params }) => {
    const path = `/en/motions/${params.id}`
    const title = loaderData?.antrag.cleanTitle ?? loaderData?.antrag.title ?? 'Motion'
    const desc = plainDescription(loaderData?.antrag.summarySimplified ?? loaderData?.antrag.abstract ?? 'Motion in the German Bundestag.')
    return {
      meta: seoMeta({ title, description: desc, canonical: path, type: 'article' }),
      links: [...canonicalLink(path), ...alternateJsonLink(path)],
      scripts: loaderData
        ? jsonLd({
            '@context': 'https://schema.org',
            '@type': 'Legislation',
            name: title,
            legislationType: loaderData.antrag.type === 'gesetzentwurf' ? 'Gesetzentwurf' : 'Antrag',
            inLanguage: 'de',
            url: `${SITE_URL}${path}/`,
            ...(loaderData.antrag.drucksache ? { legislationIdentifier: loaderData.antrag.drucksache } : {}),
            ...(loaderData.antrag.introducedDate ? { legislationDate: loaderData.antrag.introducedDate } : {}),
            ...(loaderData.antrag.abstract ? { abstract: loaderData.antrag.abstract } : {}),
            ...(loaderData.antrag.initiativeFraktion ? { creator: { '@type': 'Organization', name: loaderData.antrag.initiativeFraktion } } : {}),
          })
        : [],
    }
  },
})

function AntragDetailRoute() {
  return <AntragDetail data={Route.useLoaderData()} />
}
