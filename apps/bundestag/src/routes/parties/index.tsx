import { createFileRoute } from '@tanstack/react-router'
import { listParties } from '@/server/parties'
import { PartiesList } from '@/views/partiesList/PartiesList'
import { seoMeta, canonicalLink, breadcrumbJsonLd } from '@/lib/seo'

export const Route = createFileRoute('/parties/')({
  component: PartiesRoute,
  loader: () => listParties(),
  head: () => ({
    meta: seoMeta({
      title: 'Fraktionen',
      description: 'Fraktionen und fraktionslose Abgeordnete des Deutschen Bundestags: Sitzverteilung, Mitglieder und Abstimmungsverhalten.',
      canonical: '/parties',
    }),
    links: canonicalLink('/parties'),
    scripts: breadcrumbJsonLd([{ name: 'Machtblick', path: '/' }, { name: 'Fraktionen', path: '/parties' }]),
  }),
})

function PartiesRoute() {
  const parties = Route.useLoaderData()
  return <PartiesList parties={parties} />
}
