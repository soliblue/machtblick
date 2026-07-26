import { createFileRoute } from '@tanstack/react-router'
import { getBerlinDocument } from '@/server/document'
import { pageMeta } from '@/lib/seo'
import { DocumentDetail } from '@/views/documentDetail/DocumentDetail'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/documents/$id')({
  component: DocumentRoute,
  notFoundComponent: NotFoundPage,
  loader: ({ params }) => getBerlinDocument({ data: params.id }),
  head: ({ loaderData, params }) => pageMeta(
    loaderData?.document.title ?? 'Originaldokument',
    loaderData ? `${loaderData.document.title} von ${loaderData.party.name}, mit Einordnung zur Berlin-Wahl 2026.` : 'Originaldokument zur Berlin-Wahl 2026.',
    `/documents/${loaderData?.document.id ?? params.id}/`
  )
})

function DocumentRoute() {
  return <DocumentDetail data={Route.useLoaderData()} />
}
