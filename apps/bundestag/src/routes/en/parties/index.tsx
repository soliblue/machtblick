import { createFileRoute } from '@tanstack/react-router'
import { listParties } from '@/server/parties'
import { PartiesList } from '@/views/partiesList/PartiesList'
import { partiesListHead } from '@/lib/routeHeads'

export const Route = createFileRoute('/en/parties/')({
  component: PartiesRoute,
  loader: () => listParties(),
  head: () => partiesListHead('en'),
})

function PartiesRoute() {
  const parties = Route.useLoaderData()
  return <PartiesList parties={parties} />
}
