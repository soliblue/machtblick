import { useMemo } from 'react'
import type { BerlinTopicComparison, ProgrammeCategory } from '@machtblick/berlin-db/types'
import type { ComparisonParty } from '@/server/comparison'

export type ComparisonGroup = {
  partySlug: string
  partyShortName: string
  partyColor: string
  programmeTitle: string
  programmeStatus: BerlinTopicComparison['programmeStatus']
  topics: BerlinTopicComparison[]
}

export function useProgrammeComparison(comparisons: BerlinTopicComparison[], parties: ComparisonParty[], category: ProgrammeCategory) {
  return useMemo(() => {
    const grouped = new Map<string, BerlinTopicComparison[]>()
    for (const comparison of comparisons.filter(({ category: comparisonCategory }) => comparisonCategory === category)) {
      const topics = grouped.get(comparison.partySlug)
      topics ? topics.push(comparison) : grouped.set(comparison.partySlug, [comparison])
    }
    const groups = [...grouped.values()].map((topics) => ({
      partySlug: topics[0].partySlug,
      partyShortName: topics[0].partyShortName,
      partyColor: topics[0].partyColor,
      programmeTitle: topics[0].programmeTitle,
      programmeStatus: topics[0].programmeStatus,
      topics
    }))
    return {
      groups,
      missingParties: parties.filter(({ slug }) => !grouped.has(slug)).map(({ shortName }) => shortName)
    }
  }, [category, comparisons, parties])
}
