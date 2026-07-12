import { createFileRoute } from '@tanstack/react-router'
import { listAntraege } from '@/server/antraege'
import { AntraegeRouteBody } from '@/views/antraegeList/AntraegeRouteBody'
import { validateMotionsSearch } from '@/lib/searchParams'
import { motionsListHead } from '@/lib/routeHeads'

export const Route = createFileRoute('/motions/')({
  component: () => <AntraegeRouteBody from="/motions/" />,
  loader: () => listAntraege({ data: 'de' }),
  head: () => motionsListHead('de'),
  validateSearch: validateMotionsSearch,
})
