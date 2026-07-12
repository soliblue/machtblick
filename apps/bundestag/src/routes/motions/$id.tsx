import { createFileRoute } from '@tanstack/react-router'
import { getAntrag } from '@/server/antraege'
import { AntragDetail } from '@/views/antragDetail/AntragDetail'
import { motionDetailHead } from '@/lib/routeHeads'
import { NotFoundPage } from '@/views/notFound/NotFoundPage'

export const Route = createFileRoute('/motions/$id')({
  component: AntragDetailRoute,
  errorComponent: NotFoundPage,
  notFoundComponent: NotFoundPage,
  loader: ({ params }) => getAntrag({ data: params.id }),
  head: ({ loaderData, params }) => motionDetailHead(loaderData, params, 'de'),
})

function AntragDetailRoute() {
  return <AntragDetail data={Route.useLoaderData()} />
}
