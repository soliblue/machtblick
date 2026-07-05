import { createFileRoute } from '@tanstack/react-router'
import { getAntrag } from '@/server/antraege'
import { AntragDetail } from '@/views/antragDetail/AntragDetail'
import { seoMeta, canonicalLink, alternateJsonLink, jsonLd, plainDescription, SITE_URL } from '@/lib/seo'
import { formatDateLong } from '@/lib/format'
import { motionStatusBucket } from '@/lib/motionStatus'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/motions/$id')({
  component: AntragDetailRoute,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: ({ params }) => getAntrag({ data: params.id }),
  head: ({ loaderData, params }) => {
    const path = `/motions/${params.id}`
    const a = loaderData?.antrag
    const name = a?.cleanTitle ?? a?.title ?? 'Antrag'
    const status = { angenommen: 'angenommen', abgelehnt: 'abgelehnt', 'im-verfahren': 'im Verfahren', 'nicht-beraten': 'noch nicht beraten' }[motionStatusBucket(a?.beratungsstand ?? null)]
    const title = status === 'angenommen' || status === 'abgelehnt' ? `${name}: ${status}` : name
    const summary = plainDescription(a?.summarySimplified ?? a?.abstract ?? 'Antrag im Deutschen Bundestag.')
    const dated = `${a?.type === 'gesetzentwurf' ? 'Gesetzentwurf' : 'Antrag'}${a?.introducedDate ? ` vom ${formatDateLong(a.introducedDate)}` : ''}`
    const desc = a
      ? [
          `${summary} ${dated}${a.initiativeFraktion ? ` (${a.initiativeFraktion})` : ''}, Status: ${status}.`,
          `${summary} ${dated}, Status: ${status}.`,
          summary,
        ].find((c) => c.length <= 165) ?? summary
      : summary
    return {
      meta: seoMeta({ title, description: desc, canonical: path, type: 'article' }),
      links: [...canonicalLink(path, { englishAlternate: loaderData?.hasEnglishTranslation ?? false }), ...alternateJsonLink(path)],
      scripts: loaderData
        ? jsonLd({
            '@context': 'https://schema.org',
            '@type': 'Legislation',
            name,
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
