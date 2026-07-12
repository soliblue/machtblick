import { createFileRoute } from '@tanstack/react-router'
import { listAntraege } from '@/server/antraege'
import { AntraegeRouteBody } from '@/views/antraegeList/AntraegeRouteBody'
import { validateMotionsSearch } from '@/lib/searchParams'
import { motionsListHead } from '@/lib/routeHeads'

export const Route = createFileRoute('/en/motions/')({
  component: () => <AntraegeRouteBody from="/en/motions/" />,
  loader: () => listAntraege({ data: 'en' }),
  head: () => motionsListHead('en'),
  validateSearch: validateMotionsSearch,
})
