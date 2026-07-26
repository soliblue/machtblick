import { openBerlinDb } from '../database.ts'
import type { BerlinTopicComparison } from '../types.ts'

type ComparisonRow = Omit<BerlinTopicComparison, 'positions' | 'categories'> & { positionsJson: string }

export function readBerlinTopicComparisons(): BerlinTopicComparison[] {
  const db = openBerlinDb()
  const comparisons = db.prepare(`
    SELECT
      programme_topic_categories.category,
      programme_topics.slug,
      programme_topics.title,
      programme_topics.summary,
      programme_topics.positions_json AS positionsJson,
      sources.url AS sourceUrl,
      parties.slug AS partySlug,
      parties.name AS partyName,
      parties.short_name AS partyShortName,
      parties.color AS partyColor,
      programmes.title AS programmeTitle,
      programmes.status AS programmeStatus
    FROM programme_topic_categories
    JOIN programme_topics
      ON programme_topics.party_slug = programme_topic_categories.party_slug
      AND programme_topics.slug = programme_topic_categories.topic_slug
    JOIN programmes ON programmes.party_slug = programme_topics.party_slug
    JOIN parties ON parties.slug = programme_topics.party_slug
    JOIN sources ON sources.id = programme_topics.source_id
    ORDER BY programme_topic_categories.category, parties.short_name COLLATE NOCASE, programme_topics.sort_order
  `).all() as ComparisonRow[]
  db.close()
  return comparisons.map(({ positionsJson, category, ...comparison }) => ({
    ...comparison,
    category,
    positions: JSON.parse(positionsJson) as string[],
    categories: [category]
  }))
}
