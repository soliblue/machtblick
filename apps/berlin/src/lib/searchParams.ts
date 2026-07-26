export type CandidateSearch = {
  q?: string
  party?: string
  district?: string
  constituency?: number
  personal?: boolean
}

export function validateCandidateSearch(search: Record<string, unknown>): CandidateSearch {
  const constituency = Number(search.constituency)
  return {
    q: typeof search.q === 'string' ? search.q : undefined,
    party: typeof search.party === 'string' ? search.party : undefined,
    district: typeof search.district === 'string' ? search.district : undefined,
    constituency: Number.isInteger(constituency) && constituency > 0 ? constituency : undefined,
    personal: search.personal === true || search.personal === 'true' || search.personal === '1' ? true : undefined
  }
}
