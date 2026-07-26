import { openBerlinDb } from '../database.ts'
import type {
  BerlinParty,
  BerlinProgramme,
  BerlinProgrammeDetail,
  BerlinProgrammeDocument,
  BerlinProgrammeListItem,
  BerlinProgrammeTopic,
  BerlinSource
} from '../types.ts'

type TopicRow = Omit<BerlinProgrammeTopic, 'positions' | 'categories'> & { positionsJson: string; categoriesJson: string }
type DocumentRow = Omit<BerlinProgrammeDocument, 'embeddable'> & { embeddableInt: number }

export function readBerlinProgrammes(): BerlinProgrammeListItem[] {
  const db = openBerlinDb()
  const programmes = db.prepare(`
    SELECT
      programmes.party_slug AS partySlug,
      programmes.status,
      programmes.title,
      programmes.publication_date AS publicationDate,
      programmes.summary,
      sources.url AS sourceUrl,
      programmes.retrieved_at AS retrievedAt,
      parties.name AS partyName,
      parties.short_name AS partyShortName,
      parties.color AS partyColor,
      (SELECT COUNT(*) FROM programme_topics WHERE party_slug = programmes.party_slug) AS topicCount,
      (SELECT COUNT(*) FROM programme_documents WHERE party_slug = programmes.party_slug) AS documentCount
    FROM programmes
    JOIN parties ON parties.slug = programmes.party_slug
    JOIN sources ON sources.id = programmes.source_id
    ORDER BY parties.short_name COLLATE NOCASE
  `).all() as BerlinProgrammeListItem[]
  db.close()
  return programmes
}

export function readBerlinProgrammeDetail(partySlug: string): BerlinProgrammeDetail | null {
  const db = openBerlinDb()
  const party = db.prepare(`
    SELECT
      slug,
      name,
      short_name AS shortName,
      list_type AS listType,
      list_scope AS listScope,
      programme_status AS programmeStatus,
      programme_url AS programmeUrl,
      candidate_coverage AS candidateCoverage,
      candidate_url AS candidateUrl,
      color
    FROM parties
    WHERE slug = ?
  `).get(partySlug) as BerlinParty | undefined
  const programme = party ? db.prepare(`
    SELECT
      programmes.party_slug AS partySlug,
      programmes.status,
      programmes.title,
      programmes.publication_date AS publicationDate,
      programmes.summary,
      sources.url AS sourceUrl,
      programmes.retrieved_at AS retrievedAt
    FROM programmes
    JOIN sources ON sources.id = programmes.source_id
    WHERE programmes.party_slug = ?
  `).get(partySlug) as BerlinProgramme | undefined : undefined
  const topicRows = programme ? db.prepare(`
    SELECT
      programme_topics.slug,
      programme_topics.title,
      programme_topics.summary,
      programme_topics.positions_json AS positionsJson,
      COALESCE((
        SELECT json_group_array(programme_topic_categories.category)
        FROM programme_topic_categories
        WHERE programme_topic_categories.party_slug = programme_topics.party_slug
          AND programme_topic_categories.topic_slug = programme_topics.slug
        ORDER BY programme_topic_categories.sort_order
      ), '[]') AS categoriesJson,
      sources.url AS sourceUrl
    FROM programme_topics
    JOIN sources ON sources.id = programme_topics.source_id
    WHERE programme_topics.party_slug = ?
    ORDER BY programme_topics.sort_order
  `).all(partySlug) as TopicRow[] : []
  const documents = programme ? db.prepare(`
    SELECT
      programme_documents.id,
      programme_documents.party_slug AS partySlug,
      sources.title,
      sources.url,
      programme_documents.format,
      sources.publisher,
      sources.publication_date AS publicationDate,
      programme_documents.kind,
      programme_documents.embeddable AS embeddableInt
    FROM programme_documents
    JOIN sources ON sources.id = programme_documents.source_id
    WHERE programme_documents.party_slug = ?
    ORDER BY programme_documents.sort_order
  `).all(partySlug) as DocumentRow[] : []
  const sources = programme ? db.prepare(`
    SELECT DISTINCT
      sources.id,
      sources.kind,
      sources.url,
      sources.title,
      sources.publisher,
      sources.publication_date AS publicationDate,
      sources.retrieved_at AS retrievedAt
    FROM (
      SELECT
        sources.*,
        ROW_NUMBER() OVER (
          PARTITION BY sources.url
          ORDER BY CASE sources.kind WHEN 'programme_document' THEN 0 ELSE 1 END
        ) AS sourceRank
      FROM sources
      WHERE sources.id IN (
        SELECT source_id FROM programmes WHERE party_slug = ?
        UNION
        SELECT source_id FROM programme_topics WHERE party_slug = ?
        UNION
        SELECT source_id FROM programme_documents WHERE party_slug = ?
      )
    ) AS sources
    WHERE sources.sourceRank = 1
    ORDER BY sources.title COLLATE NOCASE
  `).all(partySlug, partySlug, partySlug) as BerlinSource[] : []
  const result = party && programme ? {
    party,
    programme,
    topics: topicRows.map(({ positionsJson, categoriesJson, ...topic }) => ({
      ...topic,
      positions: JSON.parse(positionsJson) as string[],
      categories: JSON.parse(categoriesJson) as BerlinProgrammeTopic['categories']
    })),
    documents: documents.map(({ embeddableInt, ...document }) => ({ ...document, embeddable: embeddableInt === 1 })),
    sources
  } : null
  db.close()
  return result
}
