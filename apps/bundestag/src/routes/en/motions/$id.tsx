import { createFileRoute } from '@tanstack/react-router'
import { getAntrag } from '@/server/antraege'
import { AntragDetail } from '@/views/antragDetail/AntragDetail'
import { seoMeta, canonicalLink, alternateJsonLink, jsonLd, plainDescription, SITE_URL } from '@/lib/seo'
import { formatDateLong } from '@/lib/format'
import { motionStatusBucket } from '@/lib/motionStatus'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/en/motions/$id')({
  component: AntragDetailRoute,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: ({ params }) => getAntrag({ data: { id: params.id, locale: 'en' } }),
  head: ({ loaderData, params }) => {
    const path = `/en/motions/${params.id}`
    const a = loaderData?.antrag
    const name = a?.cleanTitle ?? a?.title ?? 'Motion'
    const status = { angenommen: 'adopted', abgelehnt: 'rejected', 'im-verfahren': 'in progress', 'nicht-beraten': 'not yet debated' }[motionStatusBucket(a?.beratungsstand ?? null)]
    const title = status === 'adopted' || status === 'rejected' ? `${name}: ${status}` : name
    const summary = plainDescription(a?.summarySimplified ?? a?.abstract ?? 'Motion in the German Bundestag.')
    const dated = `${a?.type === 'gesetzentwurf' ? 'Bill' : 'Motion'}${a?.introducedDate ? ` introduced ${formatDateLong(a.introducedDate, 'en')}` : ''}`
    const desc = a
      ? [
          `${summary} ${dated}${a.initiativeFraktion ? ` (${a.initiativeFraktion})` : ''}, status: ${status}.`,
          `${summary} ${dated}, status: ${status}.`,
          summary,
        ].find((c) => c.length <= 165) ?? summary
      : summary
    return {
      meta: seoMeta({ title, description: desc, canonical: path, type: 'article' }),
      links: [...canonicalLink(path), ...alternateJsonLink(path)],
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
