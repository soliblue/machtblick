export const CANDIDATE_DETAIL_TAB_IDS = ['biografie', 'persoenlich', 'partei'] as const

export type CandidateDetailTab = typeof CANDIDATE_DETAIL_TAB_IDS[number]

export const candidateDetailTabLabels: Record<CandidateDetailTab, string> = {
  biografie: 'Biografie',
  persoenlich: 'Persönlich',
  partei: 'Partei'
}
