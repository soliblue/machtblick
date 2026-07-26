import { openBerlinDb } from '../database.ts'
import type { BerlinCandidateListItem, BerlinCatalog, BerlinParty } from '../types.ts'

type CandidateRow = Omit<BerlinCandidateListItem, 'districts' | 'constituencies' | 'candidacies' | 'priorities'> & {
  districtsJson: string
  constituenciesJson: string
  candidaciesJson: string
  prioritiesJson: string
}

export function readBerlinCatalog(): BerlinCatalog {
  const db = openBerlinDb()
  const parties = db.prepare(`
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
    ORDER BY short_name COLLATE NOCASE
  `).all() as BerlinParty[]
  const candidates = db.prepare(`
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
      candidates.source_url AS sourceUrl,
      candidate_profiles.occupation,
      candidate_profiles.birth_year AS birthYear,
      candidate_profiles.biography_summary AS biographySummary,
      COALESCE(candidate_profiles.priorities_json, '[]') AS prioritiesJson,
      candidate_portraits.image_url AS portraitUrl,
      (
        SELECT COUNT(*)
        FROM (
          SELECT source_id
          FROM candidate_candidacies
          WHERE candidate_slug = candidates.slug
          UNION
          SELECT source_id
          FROM candidate_profiles
          WHERE candidate_slug = candidates.slug
          UNION
          SELECT source_id
          FROM candidate_portraits
          WHERE candidate_slug = candidates.slug
          UNION
          SELECT source_id
          FROM candidate_links
          WHERE candidate_slug = candidates.slug
        )
      ) AS sourceCount,
      COALESCE((
        SELECT json_group_array(candidate_districts.district)
        FROM (
          SELECT DISTINCT district
          FROM candidate_candidacies
          WHERE candidate_slug = candidates.slug
            AND district IS NOT NULL
          ORDER BY district COLLATE NOCASE
        ) AS candidate_districts
      ), '[]') AS districtsJson,
      COALESCE((
        SELECT json_group_array(json_object('district', candidate_constituencies.district, 'number', candidate_constituencies.constituency))
        FROM (
          SELECT DISTINCT district, constituency
          FROM candidate_candidacies
          WHERE candidate_slug = candidates.slug
            AND candidacy_type = 'wahlkreis'
            AND district IS NOT NULL
            AND constituency IS NOT NULL
          ORDER BY district COLLATE NOCASE, constituency
        ) AS candidate_constituencies
      ), '[]') AS constituenciesJson,
      COALESCE((
        SELECT json_group_array(json_object(
          'type', candidate_ballot_lines.candidacyType,
          'listPosition', candidate_ballot_lines.listPosition,
          'district', candidate_ballot_lines.district,
          'constituency', candidate_ballot_lines.constituency
        ))
        FROM (
          SELECT
            candidacy_type AS candidacyType,
            list_position AS listPosition,
            district,
            constituency
          FROM candidate_candidacies
          WHERE candidate_slug = candidates.slug
          ORDER BY
            CASE candidacy_type
              WHEN 'wahlkreis' THEN 0
              WHEN 'bezirksliste' THEN 1
              ELSE 2
            END,
            district COLLATE NOCASE,
            list_position
        ) AS candidate_ballot_lines
      ), '[]') AS candidaciesJson
    FROM candidates
    JOIN parties ON parties.slug = candidates.party_slug
    LEFT JOIN candidate_profiles ON candidate_profiles.candidate_slug = candidates.slug
    LEFT JOIN candidate_portraits ON candidate_portraits.candidate_slug = candidates.slug
    ORDER BY parties.short_name COLLATE NOCASE, candidates.district COLLATE NOCASE, candidates.list_position, candidates.name COLLATE NOCASE
  `).all() as CandidateRow[]
  const metadata = Object.fromEntries((db.prepare('SELECT key, value FROM metadata').all() as { key: string; value: string }[]).map(({ key, value }) => [key, value]))
  db.close()
  return {
    parties,
    candidates: candidates.map(({ districtsJson, constituenciesJson, candidaciesJson, prioritiesJson, ...candidate }) => ({
      ...candidate,
      districts: JSON.parse(districtsJson) as string[],
      constituencies: JSON.parse(constituenciesJson) as BerlinCandidateListItem['constituencies'],
      candidacies: JSON.parse(candidaciesJson) as BerlinCandidateListItem['candidacies'],
      priorities: JSON.parse(prioritiesJson) as string[]
    })),
    retrievedAt: metadata.retrieved_at,
    electionDate: metadata.election_date,
    admissionSourceUrl: metadata.admission_source_url,
    candidatePublicationUrl: metadata.candidate_publication_url
  }
}
