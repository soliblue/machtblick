export type AffiliationRow = {
  member_id: string
  party: string
  valid_from: string
  valid_to: string | null
}

export function partyAt(affiliations: AffiliationRow[] = [], date: string): string {
  return affiliations.find((row) => row.valid_from <= date && (row.valid_to === null || row.valid_to >= date))?.party ?? ''
}
