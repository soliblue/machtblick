import { openBerlinDb } from '../database.ts'
import type {
  BerlinParty,
  BerlinProgramme,
  BerlinProgrammeDocument,
  BerlinProgrammeDocumentDetail,
  BerlinProgrammeDocumentIndexItem,
  BerlinSource
} from '../types.ts'

type DocumentRow = Omit<BerlinProgrammeDocument, 'embeddable'> & { embeddableInt: number }

export function readBerlinProgrammeDocuments(): BerlinProgrammeDocumentIndexItem[] {
  const db = openBerlinDb()
  const documents = db.prepare(`
    SELECT
      programme_documents.id,
      programme_documents.party_slug AS partySlug,
      sources.title,
      programme_documents.format,
      programme_documents.kind
    FROM programme_documents
    JOIN sources ON sources.id = programme_documents.source_id
    ORDER BY programme_documents.party_slug, programme_documents.sort_order
  `).all() as BerlinProgrammeDocumentIndexItem[]
  db.close()
  return documents
}

export function readBerlinProgrammeDocument(id: string): BerlinProgrammeDocumentDetail | null {
  const db = openBerlinDb()
  const document = db.prepare(`
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
    WHERE programme_documents.id = ?
  `).get(id) as DocumentRow | undefined
  const party = document ? db.prepare(`
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
  `).get(document.partySlug) as BerlinParty : undefined
  const programme = document ? db.prepare(`
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
  `).get(document.partySlug) as BerlinProgramme : undefined
  const sources = document ? db.prepare(`
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
        SELECT source_id FROM programme_documents WHERE id = ?
        UNION
        SELECT source_id FROM programmes WHERE party_slug = ?
      )
    ) AS sources
    WHERE sources.sourceRank = 1
    ORDER BY sources.kind, sources.title COLLATE NOCASE
  `).all(id, document.partySlug) as BerlinSource[] : []
  const result = document && party && programme ? {
    document: {
      id: document.id,
      partySlug: document.partySlug,
      title: document.title,
      url: document.url,
      format: document.format,
      publisher: document.publisher,
      publicationDate: document.publicationDate,
      kind: document.kind,
      embeddable: document.embeddableInt === 1
    },
    party,
    programme,
    sources
  } : null
  db.close()
  return result
}
