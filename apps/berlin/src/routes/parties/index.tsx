import { createFileRoute } from '@tanstack/react-router'
import { getBerlinCatalog } from '@/server/catalog'
import { PartiesList } from '@/views/parties/PartiesList'
import { pageMeta } from '@/lib/seo'

export const Route = createFileRoute('/parties/')({
  component: PartiesRoute,
  loader: () => getBerlinCatalog(),
  head: () => pageMeta(
    'Parteien zur Berlin-Wahl 2026',
    'Die 17 zugelassenen Parteien mit Landeslisten oder Bezirkslisten zur Berliner Abgeordnetenhauswahl 2026.',
    '/parties/'
  )
})

function PartiesRoute() {
  const catalog = Route.useLoaderData()
  return (
    <PartiesList
      parties={catalog.parties}
      candidateCounts={catalog.candidates.reduce<Record<string, number>>((counts, candidate) => ({
        ...counts,
        [candidate.partySlug]: (counts[candidate.partySlug] ?? 0) + 1
      }), {})}
      admissionSourceUrl={catalog.admissionSourceUrl}
    />
  )
}
