import { useQuery } from '@tanstack/react-query'
import { getAnfragenStatsForParty } from '@/server/anfragenStats'

export function usePartyAnfragenStats(slug: string) {
  return useQuery({
    queryKey: ['partyAnfragenStats', slug],
    queryFn: () => getAnfragenStatsForParty({ data: slug }),
    staleTime: Infinity,
  })
}
