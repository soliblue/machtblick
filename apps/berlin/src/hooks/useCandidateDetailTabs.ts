import type { CandidateDetailData } from '@/server/candidate'
import type { CandidateDetailTab } from '@/lib/candidateDetailTabs'

export function useCandidateDetailTabs(data: CandidateDetailData, requestedTab?: CandidateDetailTab) {
  const tabs: CandidateDetailTab[] = [
    ...(data.profile?.biographySummary?.trim() ? ['biografie' as const] : []),
    ...(data.profile?.priorities.some((priority) => priority.trim().length > 0) ? ['persoenlich' as const] : []),
    ...(data.programme
      && data.programme.status !== 'missing'
      && (
        data.programme.summary.trim().length > 0
        || data.programme.documentCount > 0
        || data.programme.topics.some((topic) =>
          topic.summary.trim().length > 0
          || topic.positions.some((position) => position.trim().length > 0))
      )
      ? ['partei' as const]
      : [])
  ]
  return {
    tabs,
    activeTab: tabs.includes(requestedTab ?? 'biografie') ? requestedTab ?? 'biografie' : tabs[0] ?? null
  }
}
