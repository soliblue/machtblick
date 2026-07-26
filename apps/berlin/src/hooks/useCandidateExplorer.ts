import { useMemo } from 'react'
import type { CandidateItem } from '@/server/catalog'

export function useCandidateExplorer(
  candidates: CandidateItem[],
  query: string,
  party: string | null,
  district: string | null,
  constituency: number | null,
  personalOnly: boolean
) {
  const normalized = query.trim().toLocaleLowerCase('de')
  return {
    candidates: useMemo(
      () => candidates.filter((candidate) =>
        candidate.constituencies.length > 0
        && (!party || candidate.partySlug === party)
        && (!district || candidate.constituencies.some(({ district: candidateDistrict }) => candidateDistrict === district))
        && (!constituency || candidate.constituencies.some(({ district: candidateDistrict, number }) =>
          number === constituency && candidateDistrict === district))
        && (!personalOnly || candidate.priorities.length > 0)
        && (!normalized || [
          candidate.name,
          candidate.partyShortName,
          candidate.occupation,
          candidate.biographySummary,
          ...candidate.priorities,
          ...candidate.districts
        ].filter(Boolean).join(' ').toLocaleLowerCase('de').includes(normalized))
      ).sort((a, b) => {
        const aDirect = a.constituencies.find(({ district: candidateDistrict }) => !district || candidateDistrict === district) ?? a.constituencies[0]
        const bDirect = b.constituencies.find(({ district: candidateDistrict }) => !district || candidateDistrict === district) ?? b.constituencies[0]
        return aDirect.district.localeCompare(bDirect.district, 'de')
          || aDirect.number - bDirect.number
          || a.partyShortName.localeCompare(b.partyShortName, 'de')
      }),
      [candidates, constituency, district, normalized, party, personalOnly]
    ),
    parties: useMemo(
      () => [...new Map(candidates
        .filter(({ constituencies: candidateConstituencies }) => candidateConstituencies.length > 0)
        .map((candidate) => [candidate.partySlug, candidate.partyShortName])).entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label, 'de')),
      [candidates]
    ),
    districts: useMemo(
      () => [...new Set(candidates.flatMap(({ constituencies: candidateConstituencies }) =>
        candidateConstituencies.map(({ district: candidateDistrict }) => candidateDistrict)
      ))].sort((a, b) => a.localeCompare(b, 'de')),
      [candidates]
    ),
    constituencies: useMemo(
      () => [...new Set(candidates.flatMap(({ constituencies: candidateConstituencies }) =>
        candidateConstituencies.filter(({ district: candidateDistrict }) => candidateDistrict === district).map(({ number }) => number)
      ))].sort((a, b) => a - b),
      [candidates, district]
    )
  }
}
