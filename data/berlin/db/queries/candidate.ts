import { openBerlinDb } from '../database.ts'
import type {
  BerlinCandidate,
  BerlinCandidateDetail,
  BerlinCandidateLink,
  BerlinCandidatePortrait,
  BerlinCandidateProfile,
  BerlinCandidacy,
  BerlinParty,
  BerlinSource
} from '../types.ts'

type ProfileRow = Omit<BerlinCandidateProfile, 'priorities'> & { prioritiesJson: string }
type TopicCandidacyRow = Omit<BerlinCandidacy, 'type'> & { type: BerlinCandidacy['type'] }

export function readBerlinCandidateDetail(slug: string): BerlinCandidateDetail | null {
  const db = openBerlinDb()
  const candidate = db.prepare(`
    SELECT
      candidates.slug,
      candidates.name,
      candidates.party_slug AS partySlug,
      parties.short_name AS partyShortName,
      parties.color AS partyColor,
      candidates.candidacy_type AS candidacyType,
      candidates.list_position AS listPosition,
      candidates.district,
      candidates.constituency,
      candidates.source_status AS sourceStatus,
      candidates.source_url AS sourceUrl
    FROM candidates
    JOIN parties ON parties.slug = candidates.party_slug
    WHERE candidates.slug = ?
  `).get(slug) as BerlinCandidate | undefined
  const party = candidate ? db.prepare(`
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
  `).get(candidate.partySlug) as BerlinParty : undefined
  const profileRow = candidate ? db.prepare(`
    SELECT
      occupation,
      birth_year AS birthYear,
      biography_summary AS biographySummary,
      priorities_json AS prioritiesJson,
      retrieved_at AS retrievedAt
    FROM candidate_profiles
    WHERE candidate_slug = ?
  `).get(slug) as ProfileRow | undefined : undefined
  const portrait = candidate ? db.prepare(`
    SELECT
      candidate_portraits.image_url AS imageUrl,
      sources.url AS sourceUrl,
      sources.publisher,
      candidate_portraits.author,
      candidate_portraits.license,
      candidate_portraits.license_url AS licenseUrl,
      candidate_portraits.status,
      candidate_portraits.provenance,
      candidate_portraits.retrieved_at AS retrievedAt
    FROM candidate_portraits
    JOIN sources ON sources.id = candidate_portraits.source_id
    WHERE candidate_portraits.candidate_slug = ?
  `).get(slug) as BerlinCandidatePortrait | undefined : undefined
  const candidacies = candidate ? db.prepare(`
    SELECT
      candidate_candidacies.candidacy_type AS type,
      candidate_candidacies.list_position AS listPosition,
      candidate_candidacies.district,
      candidate_candidacies.constituency,
      sources.url AS sourceUrl
    FROM candidate_candidacies
    JOIN sources ON sources.id = candidate_candidacies.source_id
    WHERE candidate_candidacies.candidate_slug = ?
    ORDER BY
      CASE candidate_candidacies.candidacy_type
        WHEN 'wahlkreis' THEN 0
        WHEN 'bezirksliste' THEN 1
        ELSE 2
      END,
      candidate_candidacies.district COLLATE NOCASE,
      candidate_candidacies.list_position
  `).all(slug) as TopicCandidacyRow[] : []
  const links = candidate ? db.prepare(`
    SELECT kind, label, url
    FROM candidate_links
    WHERE candidate_slug = ?
    ORDER BY
      CASE kind
        WHEN 'profile' THEN 0
        WHEN 'website' THEN 1
        WHEN 'email' THEN 2
        ELSE 3
      END,
      label COLLATE NOCASE
  `).all(slug) as BerlinCandidateLink[] : []
  const sources = candidate ? db.prepare(`
    SELECT DISTINCT
      sources.id,
      sources.kind,
      sources.url,
      sources.title,
      sources.publisher,
      sources.publication_date AS publicationDate,
      sources.retrieved_at AS retrievedAt
    FROM sources
    WHERE sources.id IN (
      SELECT source_id FROM candidate_candidacies WHERE candidate_slug = ?
      UNION
      SELECT source_id FROM candidate_profiles WHERE candidate_slug = ?
      UNION
      SELECT source_id FROM candidate_portraits WHERE candidate_slug = ?
      UNION
      SELECT source_id FROM candidate_links WHERE candidate_slug = ?
    )
    ORDER BY sources.kind, sources.title COLLATE NOCASE
  `).all(slug, slug, slug, slug) as BerlinSource[] : []
  const result = candidate && party ? {
    candidate,
    party,
    candidacies,
    profile: profileRow ? {
      occupation: profileRow.occupation,
      birthYear: profileRow.birthYear,
      biographySummary: profileRow.biographySummary,
      priorities: JSON.parse(profileRow.prioritiesJson) as string[],
      retrievedAt: profileRow.retrievedAt
    } : null,
    portrait: portrait ?? null,
    links,
    sources
  } : null
  db.close()
  return result
}
