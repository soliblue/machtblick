import { createFileRoute } from '@tanstack/react-router'
import { getAntrag } from '@/server/antraege'
import { AntragDetail } from '@/views/antragDetail/AntragDetail'
import { motionDetailHead } from '@/lib/routeHeads'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/en/motions/$id')({
  component: AntragDetailRoute,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: ({ params }) => getAntrag({ data: { id: params.id, locale: 'en' } }),
  head: ({ loaderData, params }) => motionDetailHead(loaderData, params, 'en'),
})

function AntragDetailRoute() {
  return <AntragDetail data={Route.useLoaderData()} />
}
