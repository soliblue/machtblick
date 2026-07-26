import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ProgrammeCategory } from '@machtblick/berlin-db/types'
import { getBerlinComparison } from '@/server/comparison'
import { useProgrammeComparison } from '@/hooks/useProgrammeComparison'
import { programmeCategories } from '@/lib/programmeCategories'
import { pageMeta } from '@/lib/seo'
import { ProgrammeComparison } from '@/views/comparison/ProgrammeComparison'

export const Route = createFileRoute('/compare')({
  component: ComparisonRoute,
  loader: () => getBerlinComparison(),
  validateSearch: (search: Record<string, unknown>) => ({
    topic: typeof search.topic === 'string' && programmeCategories.includes(search.topic as ProgrammeCategory)
      ? search.topic as ProgrammeCategory
      : undefined
  }),
  head: () => pageMeta(
    'Parteien nach Themen vergleichen',
    'Positionen der Parteien zur Berlin-Wahl 2026 zu Wohnen, Mobilität, Klima, Bildung und weiteren Themen direkt gegenübergestellt.',
    '/compare/'
  )
})

function ComparisonRoute() {
  const data = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/compare' })
  const category = search.topic ?? 'wohnen'
  const comparison = useProgrammeComparison(data.comparisons, data.parties, category)
  return (
    <ProgrammeComparison
      category={category}
      groups={comparison.groups}
      missingParties={comparison.missingParties}
      onCategoryChange={(topic) => navigate({ search: { topic: topic === 'wohnen' ? undefined : topic } })}
    />
  )
}
