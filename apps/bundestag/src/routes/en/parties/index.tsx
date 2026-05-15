import { createFileRoute } from '@tanstack/react-router'
import { listParties } from '@/server/parties'
import { PartiesList } from '@/views/partiesList/PartiesList'
import { seoMeta, canonicalLink } from '@/lib/seo'

export const Route = createFileRoute('/en/parties/')({
  component: PartiesRoute,
  loader: () => listParties(),
  head: () => ({
    meta: seoMeta({
      title: 'Parties',
      description: 'Parliamentary groups and unaffiliated members in the Bundestag: seats, members, and voting behavior.',
      canonical: '/en/parties',
    }),
    links: canonicalLink('/en/parties'),
  }),
})

function PartiesRoute() {
  const parties = Route.useLoaderData()
  return <PartiesList parties={parties} />
}
