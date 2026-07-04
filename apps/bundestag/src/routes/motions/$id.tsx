import { createFileRoute } from '@tanstack/react-router'
import { getAntrag } from '@/server/antraege'
import { AntragDetail } from '@/views/antragDetail/AntragDetail'
import { seoMeta, canonicalLink, alternateJsonLink, jsonLd, plainDescription, SITE_URL } from '@/lib/seo'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/motions/$id')({
  component: AntragDetailRoute,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: ({ params }) => getAntrag({ data: params.id }),
  head: ({ loaderData, params }) => {
    const path = `/motions/${params.id}`
    const title = loaderData?.antrag.cleanTitle ?? loaderData?.antrag.title ?? 'Antrag'
    const desc = plainDescription(loaderData?.antrag.summarySimplified ?? loaderData?.antrag.abstract ?? 'Antrag im Deutschen Bundestag.')
    return {
      meta: seoMeta({ title, description: desc, canonical: path, type: 'article' }),
      links: [...canonicalLink(path, { englishAlternate: loaderData?.hasEnglishTranslation ?? false }), ...alternateJsonLink(path)],
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
