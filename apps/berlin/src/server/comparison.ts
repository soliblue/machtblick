import { createServerFn } from '@tanstack/react-start'
import { readBerlinCatalog, readBerlinTopicComparisons } from '@machtblick/berlin-db/client'
import type { BerlinTopicComparison } from '@machtblick/berlin-db/types'

export type ComparisonParty = {
  slug: string
  shortName: string
}

export type ComparisonData = {
  comparisons: BerlinTopicComparison[]
  parties: ComparisonParty[]
}

export const getBerlinComparison = createServerFn({ method: 'GET' })
  .handler(async (): Promise<ComparisonData> => ({
    comparisons: readBerlinTopicComparisons(),
    parties: readBerlinCatalog().parties.map(({ slug, shortName }) => ({ slug, shortName }))
  }))
