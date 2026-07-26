import { openBerlinDb } from '../database.ts'
import type { BerlinCoverage } from '../types.ts'

export function readBerlinCoverage(): BerlinCoverage {
  const db = openBerlinDb()
  const coverage = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM parties) AS partyCount,
      (SELECT COUNT(DISTINCT party_slug) FROM candidates) AS partyCandidateCount,
      (SELECT COUNT(*) FROM candidates) AS candidateCount,
      (SELECT COUNT(*) FROM candidate_candidacies) AS candidacyCount,
      (SELECT COUNT(*) FROM candidate_profiles WHERE biography_summary IS NOT NULL) AS biographyCount,
      (SELECT COUNT(*) FROM candidate_profiles WHERE priorities_json != '[]') AS priorityCount,
      (SELECT COUNT(*) FROM candidate_portraits) AS portraitCount,
      (SELECT COUNT(*) FROM programmes WHERE status != 'missing') AS programmeCount,
      (SELECT COUNT(*) FROM programmes WHERE status = 'current_2026') AS currentProgrammeCount,
      (SELECT COUNT(*) FROM programme_topics) AS topicCount,
      (SELECT COUNT(*) FROM programme_documents) AS documentCount
  `).get() as BerlinCoverage
  db.close()
  return coverage
}
