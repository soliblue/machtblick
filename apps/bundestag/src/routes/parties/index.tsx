import { createFileRoute } from '@tanstack/react-router'
import { listParties } from '@/server/parties'
import { PartiesList } from '@/views/partiesList/PartiesList'
import { partiesListHead } from '@/lib/routeHeads'

export const Route = createFileRoute('/parties/')({
  component: PartiesRoute,
  loader: () => listParties(),
  head: () => partiesListHead('de'),
})

function PartiesRoute() {
  const parties = Route.useLoaderData()
  return <PartiesList parties={parties} />
}
